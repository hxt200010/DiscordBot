const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

const algorithm = `
class Graph {
    constructor() {
        this.vertices = new Map();
    }

    addVertex(vertex) {
        if (!this.vertices.has(vertex)) {
            this.vertices.set(vertex, []);
        }
    }

    addEdge(vertex1, vertex2) {
        this.vertices.get(vertex1).push(vertex2);
        this.vertices.get(vertex2).push(vertex1); // For an undirected graph
    }

    dfsRecursive(start) {
        const visited = new Set();
        const visitedNodes = [];

        const explore = (vertex) => {
            visited.add(vertex);
            visitedNodes.push(vertex);

            for (const neighbor of this.vertices.get(vertex)) {
                if (!visited.has(neighbor)) {
                    explore(neighbor);
                }
            }
        };

        explore(start);
        return visitedNodes;
    }
}
`;

class Graph {
    constructor() {
        this.vertices = new Map();
    }

    addVertex(vertex) {
        if (!this.vertices.has(vertex)) {
            this.vertices.set(vertex, []);
        }
    }

    addEdge(vertex1, vertex2) {
        this.vertices.get(vertex1).push(vertex2);
        this.vertices.get(vertex2).push(vertex1); // For an undirected graph
    }

    dfsRecursive(start) {
        const visited = new Set();
        const visitedNodes = [];

        const explore = (vertex) => {
            visited.add(vertex);
            visitedNodes.push(vertex);

            for (const neighbor of this.vertices.get(vertex)) {
                if (!visited.has(neighbor)) {
                    explore(neighbor);
                }
            }
        };

        explore(start);
        return visitedNodes;
    }
}

module.exports = {
    deleted: true, // Consolidated into /algo command
    name: 'dfs',
    description: 'Perform depth-first search on a graph',
    options: [
        {
            name: 'vertices',
            description: 'Please type each vertex separated with space',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'start',
            description: 'The starting vertex for DFS',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    callback: async (client, interaction) => {
        try {
            const input = interaction.options.getString('vertices');
            const startVertex = interaction.options.getString('start');
            const vertices = input.split(' ');

            const graph = new Graph();
            for (const vertex of vertices) {
                graph.addVertex(vertex);
            }

            // Add edges as needed
            // graph.addEdge('vertex1', 'vertex2');

            // Start timing the DFS operation
            const start = process.hrtime();
            const visitedNodes = graph.dfsRecursive(startVertex);
            const [seconds, nanoseconds] = process.hrtime(start);
            const timeTakens = (seconds * 1000) + (nanoseconds / 1e6); // Convert to milliseconds

            const embed = new EmbedBuilder()
                .setTitle('Depth-First Search Result')
                .setColor('Random')
                .setThumbnail(client.user.displayAvatarURL())
                .addFields([
                    {
                        name: 'Description',
                        value: 'Depth-First Search (DFS) is an algorithm used for traversing or searching tree or graph data structures. Starting from the given vertex, it explores as far as possible along each branch before backtracking, ensuring all vertices are visited.',
                        inline: false,
                    },
                    {
                        name: 'Vertices',
                        value: `\`\`${vertices.join(', ')}\`\``,
                        inline: false,
                    },
                    {
                        name: 'Starting Vertex',
                        value: `\`\`${startVertex}\`\``,
                        inline: false,
                    },
                    {
                        name: 'Visited Nodes',
                        value: `\`\`${visitedNodes.join(', ')}\`\``,
                        inline: false,
                    },
                    {
                        name: 'Time Taken',
                        value: `${timeTakens.toFixed(3)} ms`, // Show time taken with 3 decimal places
                        inline: false,
                    },
                    {
                        name: 'Algorithm',
                        value: `\`\`\`js\n${algorithm}\n\`\`\``,
                        inline: false,
                    }
                ]);

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while performing depth-first search.');
        }
    },
};
