import networkx as nx
import matplotlib.pyplot as plt
import sys
import json
import os

def generate_graph(edges, cycles, output_path):
    # edges: list of [source, target]
    # cycles: list of list of node_ids
    
    G = nx.DiGraph()
    
    # Add all edges
    for edge in edges:
        source = os.path.basename(edge[0])
        target = os.path.basename(edge[1])
        G.add_edge(source, target)
        
    plt.figure(figsize=(10, 8), dpi=100)
    
    # Define circular dependency edges
    cycle_edges = set()
    for cycle in cycles:
        for i in range(len(cycle) - 1):
            s = os.path.basename(cycle[i])
            t = os.path.basename(cycle[i+1])
            cycle_edges.add((s, t))
            
    # Layout
    pos = nx.spring_layout(G, k=0.5, iterations=50)
    
    # Draw nodes
    nx.draw_networkx_nodes(G, pos, node_size=700, node_color="#2563eb", alpha=0.8)
    
    # Draw regular edges
    regular_edges = [e for e in G.edges() if e not in cycle_edges]
    nx.draw_networkx_edges(G, pos, edgelist=regular_edges, width=1.0, alpha=0.5, edge_color="#94a3b8", arrows=True)
    
    # Draw cycle edges (Thick and Red)
    if cycle_edges:
        nx.draw_networkx_edges(G, pos, edgelist=list(cycle_edges), width=3.0, alpha=0.9, edge_color="#ef4444", arrows=True, connectionstyle="arc3,rad=0.2")
        
    # Labels
    nx.draw_networkx_labels(G, pos, font_size=8, font_color="white", font_family="sans-serif")
    
    plt.axis('off')
    plt.title("Architecture Dependency Graph", color="white", pad=20)
    plt.tight_layout()
    
    # Dark mode background
    plt.gcf().set_facecolor('#0f172a')
    
    plt.savefig(output_path, facecolor='#0f172a')
    plt.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python visualizer.py <json_config>")
        sys.exit(1)
        
    with open(sys.argv[1], 'r') as f:
        config = json.load(f)
        
    generate_graph(config['edges'], config['cycles'], config['output_path'])
    print(f"Graph saved to {config['output_path']}")
