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
`
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
            const start = interaction.options.getString('start');
            const vertices = input.split(' ');

            const graph = new Graph();
            for (const vertex of vertices) {
                graph.addVertex(vertex);
            }

            // Add edges as needed
            // graph.addEdge('vertex1', 'vertex2');

            const visitedNodes = graph.dfsRecursive(start);
            const startTimesstamp = Date.now(); 
            const embed = new EmbedBuilder()
                .setTitle('Depth-First Search Result')
                .setColor('Random')
                .addFields([
                    {
                        name: 'Vertices',
                        value: `\`\`${vertices.join(', ')}\`\``,
                        inline: false,
                    },
                    {
                        name: 'Starting Vertex',
                        value: `\`\`${start}\`\``,
                        inline: false,
                    },
                    {
                        name: 'Visited Nodes',
                        value: `\`\`${visitedNodes.join(', ')}\`\``,
                        inline: false,
                    },
                    {
                        name: `Time Taken`,
                        value: `${Date.now() - startTimesstamp} ms`,
                        inline: false
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
