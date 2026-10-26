package Algoritmos;

// se necessario podem alterar
import Busisnes_Logic.RedeFerroviaria;
import Objects.Grafo;
import Objects.LinhaFerrea;
import Objects.Town;
import java.util.*;

public class Pesquisa {

    public static void dfs(String inicio) {
        dfs(RedeFerroviaria.carregarGrafo(), inicio);
    }

    public static void dfs(String caminhoArquivo, String inicio) {
        dfs(RedeFerroviaria.carregarGrafo(caminhoArquivo), inicio);
    }

    private static void dfs(Grafo grafo, String nomeInicio) {
        Town inicio = validarInicio(grafo, nomeInicio, "DFS");
        if (inicio != null) {
            dfs(grafo, inicio);
        }
    }

    // DFS - Busca em Profundidade
    public static void dfs(Grafo grafo, Town inicio) {
        System.out.println("\n--- DFS a partir de " + inicio.getName() + " ---");
        Set<Town> visitados = new HashSet<>();
        dfsRecursivo(grafo, inicio, visitados);
        System.out.println();
    }

    private static void dfsRecursivo(Grafo grafo, Town atual, Set<Town> visitados) {
        visitados.add(atual);
        System.out.print(atual.getName() + " ");
        for (LinhaFerrea lf : grafo.getListaAdjacencia().get(atual)) {
            if (!visitados.contains(lf.getDestino())) {
                dfsRecursivo(grafo, lf.getDestino(), visitados);
            }
        }
    }

    public static void bfs(String inicio) {
        bfs(RedeFerroviaria.carregarGrafo(), inicio);
    }

    public static void bfs(String caminhoArquivo, String inicio) {
        bfs(RedeFerroviaria.carregarGrafo(caminhoArquivo), inicio);
    }

    private static void bfs(Grafo grafo, String nomeInicio) {
        Town inicio = validarInicio(grafo, nomeInicio, "BFS");
        if (inicio != null) {
            bfs(grafo, inicio);
        }
    }

    // BFS - Busca em Largura
    public static void bfs(Grafo grafo, Town inicio) {
        System.out.println("\n--- BFS a partir de " + inicio.getName() + " ---");
        Set<Town> visitados = new HashSet<>();
        Queue<Town> fila = new LinkedList<>();

        visitados.add(inicio);
        fila.add(inicio);

        while (!fila.isEmpty()) {
            Town atual = fila.poll();
            System.out.print(atual.getName() + " ");

            for (LinhaFerrea lf : grafo.getListaAdjacencia().get(atual)) {
                if (!visitados.contains(lf.getDestino())) {
                    visitados.add(lf.getDestino());
                    fila.add(lf.getDestino());
                }
            }
        }
        System.out.println();
    }

    private static Town validarInicio(Grafo grafo, String nomeInicio, String algoritmo) {
        if (grafo == null) {
            return null;
        }
        for (Town cidade : grafo.getVertices()) {
            if (cidade.getName().equalsIgnoreCase(nomeInicio)) {
                return cidade;
            }
        }
        System.err.println("Erro ao executar " + algoritmo + ": a cidade inicial não existe na matriz: " + nomeInicio);
        return null;
    }
}
