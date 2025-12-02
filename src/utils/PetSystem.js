const Pet = require('../models/Pet');

class PetSystem {
    async getUserPets(userId) {
        const pets = await Pet.find({ userId });
        return pets.map(pet => this._mapPet(pet));
    }

    async getPet(petId) {
        // Try to find by _id (Mongo ID)
        // If the ID passed is not a valid ObjectId, this might throw or return null.
        // The old system used random strings.
        // If we migrated, we have new ObjectIds.
        // If the code passes an old ID, it won't be found.
        // But since we are migrating data, the old IDs are gone, replaced by new Mongo IDs.
        // So we should expect Mongo IDs.
        try {
            const pet = await Pet.findById(petId);
            if (!pet) return null;
            return this._mapPet(pet);
        } catch (e) {
            return null;
        }
    }

    async addPet(userId, petData) {
        const { petName, type, stats: nestedStats, ...otherProps } = petData;

        // Merge top-level props with nested stats to handle both formats
        const sourceStats = { ...otherProps, ...(nestedStats || {}) };

        const newPet = await Pet.create({
            userId,
            petName,
            type,
            stats: {
                health: sourceStats.health || sourceStats.hp || sourceStats.maxHp || 100,
                hunger: sourceStats.hunger || 100,
                energy: sourceStats.energy || 100,
                happiness: sourceStats.happiness || 100,
                cleanliness: sourceStats.cleanliness || 100,
                affection: sourceStats.affection || 100,
                attack: sourceStats.attack,
                defense: sourceStats.defense
            },
            xp: sourceStats.xp || 0,
            level: sourceStats.level || 1,
            isWorking: sourceStats.isWorking || false,
            lastWorkUpdate: sourceStats.lastWorkUpdate || null,
            isDead: sourceStats.isDead || false,
            maxHp: sourceStats.maxHp || 100
        });

        return newPet.id;
    }

    async removePet(petId) {
        try {
            const result = await Pet.findByIdAndDelete(petId);
            return !!result;
        } catch (e) {
            return false;
        }
    }

    async updatePet(petId, updateFn) {
        try {
            const pet = await Pet.findById(petId);
            if (!pet) return false;

            // Map to a mutable object similar to what the code expects
            // But we can just modify the mongoose document directly if we want, 
            // but the calling code expects a plain object structure usually?
            // The calling code: updateFn(pet) -> modifies pet.
            // In the old code: pet was a plain object from DB.
            // Here pet is a Mongoose document.
            // Mongoose documents are mutable.

            // However, the structure needs to match.
            // My _mapPet returns a flattened structure for stats?
            // Old code: 
            // return { id, petName, type, ...stats }
            // So pet.health, pet.hunger were top level?
            // Wait, let's check old PetSystem.js again.
            // const stats = JSON.parse(pet.stats);
            // return { id, petName, type, ...stats };
            // Yes, flattened.

            // But my Mongoose model has `stats` nested.
            // So `pet.stats.health`.
            // If I pass the mongoose doc to updateFn, the user code might try `pet.health = 90`.
            // But the mongoose doc has `pet.stats.health`.
            // So I need to provide a proxy or handle the mapping.

            // Or I can update the calling code.
            // But `PetSystem.updatePet` is used in `pet.js`.
            // Let's check `pet.js`:
            // p.stats.hunger = ...
            // p.hp = ...
            // So `pet.js` expects `p.stats.hunger`.
            // But `PetSystem.js` (old) returned flattened stats?
            // Old `getUserPets`: `return { id, petName, type, ...stats }`.
            // So `pet.hunger` would be top level.
            // But `pet.js` line 47: `p.stats.hunger`.
            // This implies `pet.js` was written for a nested structure, OR `stats` in the old DB was `{ stats: { hunger: ... } }`?
            // Old DB: `stats TEXT` (JSON).
            // `JSON.parse(pet.stats)`.
            // If `pet.stats` string contained `{ "hunger": 50 }`, then `...stats` spreads `hunger` to top level.
            // So `pet.hunger` is top level.
            // But `pet.js` uses `p.stats.hunger`.
            // This suggests `pet.js` might be inconsistent or I misread `pet.js`.

            // Let's look at `pet.js` again.
            // Line 20: `if (!pet.stats) { pet.stats = ... }`
            // Line 47: `p.stats.hunger = ...`
            // This implies `pet` object HAS a `stats` property.
            // But old `PetSystem` spread `...stats`.
            // If `stats` JSON was `{ "stats": { "hunger": 50 } }`? Unlikely.
            // Or maybe `pet.js` was adding `stats` property manually?
            // Line 20 adds it if missing.

            // If I use Mongoose with nested `stats`, `pet.stats.hunger` works naturally.
            // So I should stick to the Mongoose structure and ensure `_mapPet` returns `stats` property.

            updateFn(pet);

            // If the user modified `pet` (the mongoose doc), we just save.
            // But if they modified `pet.stats.hunger`, we need to mark modified?
            // Mongoose handles direct modification usually.

            await pet.save();
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    _mapPet(petDoc) {
        // Return a structure compatible with what the app expects.
        // If the app expects `pet.stats.hunger`, we are good with Mongoose structure.
        // If the app expects `pet.hunger`, we might need to adjust.
        // Based on `pet.js` using `pet.stats.hunger`, I will return the doc (or object) with stats nested.
        return {
            id: petDoc.id,
            petName: petDoc.petName,
            type: petDoc.type,
            stats: petDoc.stats, // Nested object
            xp: petDoc.xp,
            level: petDoc.level,
            isWorking: petDoc.isWorking,
            lastWorkUpdate: petDoc.lastWorkUpdate,
            isDead: petDoc.isDead,
            hp: petDoc.stats.health,
            maxHp: petDoc.maxHp || 100
        };
    }
}

module.exports = new PetSystem();
