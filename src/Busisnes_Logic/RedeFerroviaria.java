package Busisnes_Logic;

import java.util.*;
import Objects.*;

public class RedeFerroviaria {
    private List<Town> cidades;
    private List<LinhaFerrea> linhasFerreas;

    public RedeFerroviaria() {
        this.cidades = new ArrayList<>();
        this.linhasFerreas = new ArrayList<>();
    }

    // 1. Adicionar uma Cidade (Garante que não há duplicados)
    public Town adicionarCidade(String nome) {
        Town existente = buscarCidade(nome);
        if (existente != null) {
            return existente;
        }
        Town novaCidade = new Town(nome);
        cidades.add(novaCidade);
        return novaCidade;
    }

    // Busca rápida de cidade pelo nome
    public Town buscarCidade(String nome) {
        for (Town c : cidades) {
            if (c.getName().equalsIgnoreCase(nome)) {
                return c;
            }
        }
        return null;
    }

    // 2. Conectar duas Cidades com uma Linha Férrea (Aresta Não-Direcionada / Bidirecional)
    public void adicionarLinhaFerrea(String nomeDalinhaFerrea, float distanciaKm, String cidadeOrigem, String cidadeDestino) {
        Town origem = adicionarCidade(cidadeOrigem);
        Town destino = adicionarCidade(cidadeDestino);

        LinhaFerrea linha1 = new LinhaFerrea(nomeDalinhaFerrea, distanciaKm, origem, destino);
        LinhaFerrea linha2 = new LinhaFerrea(nomeDalinhaFerrea, distanciaKm, destino, origem); // sentido inverso

        //criar o metodo para adicionar a Linha ferrea
        origem.adicionarLinha(linha1);
        destino.adicionarLinha(linha2);

        linhasFerreas.add(linha1);
    }

    // -------------------------------------------------------------
    // ALÍNEA A & B: Matriz de Adjacências
    // -------------------------------------------------------------
    public double[][] gerarMatrizAdjacencia() {
        int n = cidades.size();
        double[][] matriz = new double[n][n];

        // Preenche com 0 (sem conexão direta)
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                matriz[i][j] = 0;
            }
        }

        // Mapeia os pesos (distâncias) na matriz
        for (int i = 0; i < n; i++) {
            Town cI = cidades.get(i);
            for (LinhaFerrea linha : cI.getLinhasConectadas()) {
                int j = cidades.indexOf(linha.getDestino());
                matriz[i][j] = linha.getCusto();
            }
        }
        return matriz;
    }

    public void imprimirMatrizAdjacencia() {
        System.out.println("\n=== MATRIZ DE ADJACÊNCIAS (Distâncias em KM) ===");
        double[][] matriz = gerarMatrizAdjacencia();
        int n = cidades.size();

        // Cabeçalho das colunas
        System.out.printf("%-15s", "");
        for (Town c : cidades) {
            System.out.printf("%-12s", c.getName().substring(0, Math.min(10, c.getName().length())));
        }
        System.out.println();

        // Linhas da matriz
        for (int i = 0; i < n; i++) {
            System.out.printf("%-15s", cidades.get(i).getName());
            for (int j = 0; j < n; j++) {
                System.out.printf("%-12.1f", matriz[i][j]);
            }
            System.out.println();
        }
    }

    // -------------------------------------------------------------
    // ALÍNEA C: Listas de Adjacências
    // -------------------------------------------------------------
    public void imprimirListaAdjacencia() {
        System.out.println("\n=== LISTAS DE ADJACÊNCIAS ===");
        for (Town c : cidades) {
            System.out.print(c.getName() + " -> ");
            List<String> conexoes = new ArrayList<>();
            for (LinhaFerrea linha : c.getLinhasConectadas()) {
                conexoes.add(linha.getDestino().getName() + " (" + linha.getCusto() + " km)");
            }
            System.out.println(String.join(", ", conexoes));
        }
    }

    // Getters para os algoritmos usarem mais tarde
    public List<Town> getCidades() { return cidades; }
    public List<LinhaFerrea> getLinhasFerreas() { return linhasFerreas; }
}