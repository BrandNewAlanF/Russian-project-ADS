package Busisnes_Logic;

import java.io.*;
import java.util.*;
import Objects.*;

public class RedeFerroviaria {
    private List<Town> cidades;
    private List<LinhaFerrea> linhasFerreas;

    public RedeFerroviaria() {
        this.cidades = new ArrayList<>();
        this.linhasFerreas = new ArrayList<>();
    }

    public Town adicionarCidade(String nome) {
        Town existente = buscarCidade(nome);
        if (existente != null) {
            return existente;
        }
        Town novaCidade = new Town(nome);
        cidades.add(novaCidade);
        return novaCidade;
    }

    public Town adicionarCidade(String nome, String caminhoArquivo) {
        Town cidade = adicionarCidade(nome);
        salvarMatrizAdjacencia(caminhoArquivo);
        return cidade;
    }

    public Town buscarCidade(String nome) {
        for (Town c : cidades) {
            if (c.getName().equalsIgnoreCase(nome)) {
                return c;
            }
        }
        return null;
    }

    public void adicionarLinhaFerrea(String nomeDalinhaFerrea, float distanciaKm, String cidadeOrigem, String cidadeDestino) {
        Town origem = adicionarCidade(cidadeOrigem);
        Town destino = adicionarCidade(cidadeDestino);

        LinhaFerrea linha1 = new LinhaFerrea(nomeDalinhaFerrea, distanciaKm, origem, destino);
        LinhaFerrea linha2 = new LinhaFerrea(nomeDalinhaFerrea, distanciaKm, destino, origem);

        origem.getVizinhos().add(linha1);
        destino.getVizinhos().add(linha2);

        linhasFerreas.add(linha1);
    }

    public boolean carregarMatrizAdjacencia(String caminhoArquivo) {
        try (BufferedReader reader = new BufferedReader(new FileReader(caminhoArquivo))) {
            String linha = reader.readLine();
            if (linha == null || linha.trim().isEmpty()) {
                throw new IOException("O ficheiro da matriz de adjacência está vazio.");
            }

            StringTokenizer cabecalho = new StringTokenizer(linha);
            List<String> nomesCidades = new ArrayList<>();
            while (cabecalho.hasMoreTokens()) {
                String nome = cabecalho.nextToken().trim();
                if (!nome.isEmpty()) {
                    nomesCidades.add(nome);
                }
            }

            if (nomesCidades.isEmpty()) {
                throw new IOException("Não foram encontradas cidades no cabeçalho da matriz de adjacência.");
            }

            float[][] matriz = new float[nomesCidades.size()][nomesCidades.size()];

            for (int i = 0; i < nomesCidades.size(); i++) {
                linha = reader.readLine();
                if (linha == null) {
                    throw new IOException("O ficheiro da matriz de adjacência terminou antes do fim das linhas.");
                }

                StringTokenizer valoresLinha = new StringTokenizer(linha);
                if (!valoresLinha.hasMoreTokens()) {
                    throw new IOException("Linha vazia encontrada na matriz de adjacência.");
                }

                String nomeLinha = valoresLinha.nextToken().trim();
                if (!nomeLinha.equalsIgnoreCase(nomesCidades.get(i))) {
                    throw new IOException("A linha da matriz não corresponde à cidade esperada: " + nomesCidades.get(i));
                }

                for (int j = 0; j < nomesCidades.size(); j++) {
                    if (!valoresLinha.hasMoreTokens()) {
                        throw new IOException("Faltam valores na linha da cidade " + nomeLinha + ".");
                    }

                    float valor;
                    try {
                        valor = Float.parseFloat(valoresLinha.nextToken().trim());
                    } catch (NumberFormatException e) {
                        throw new IOException("Valor de distância inválido na linha da cidade " + nomeLinha + ".", e);
                    }
                    if (Float.isNaN(valor) || Float.isInfinite(valor) || valor < 0) {
                        throw new IOException("A distância entre cidades deve ser um número finito e não negativo.");
                    }
                    matriz[i][j] = valor;
                }
                if (valoresLinha.hasMoreTokens()) {
                    throw new IOException("Existem valores a mais na linha da cidade " + nomeLinha + ".");
                }
            }

            if (reader.readLine() != null) {
                throw new IOException("O ficheiro contém linhas adicionais após a matriz de adjacência.");
            }

            for (int i = 0; i < matriz.length; i++) {
                if (matriz[i][i] != 0) {
                    throw new IOException("A diagonal da matriz deve conter apenas zeros.");
                }
                for (int j = i + 1; j < matriz.length; j++) {
                    if (matriz[i][j] != matriz[j][i]) {
                        throw new IOException("A matriz deve ser simétrica: valores inconsistentes entre "
                                + nomesCidades.get(i) + " e " + nomesCidades.get(j) + ".");
                    }
                }
            }

            cidades = new ArrayList<>();
            linhasFerreas = new ArrayList<>();
            for (String nome : nomesCidades) {
                adicionarCidade(nome);
            }
            for (int i = 0; i < matriz.length; i++) {
                for (int j = i + 1; j < matriz.length; j++) {
                    if (matriz[i][j] > 0) {
                        adicionarLinhaFerrea("Linha-" + nomesCidades.get(i) + "-" + nomesCidades.get(j),
                                matriz[i][j], nomesCidades.get(i), nomesCidades.get(j));
                    }
                }
            }

            System.out.println("Matriz de adjacência carregada com sucesso a partir de: " + caminhoArquivo);
            return true;
        } catch (FileNotFoundException e) {
            System.err.println("Erro ao abrir o ficheiro da matriz de adjacência: " + caminhoArquivo + ". Verifique se o ficheiro existe.");
            return false;
        } catch (IOException e) {
            System.err.println("Erro ao ler a matriz de adjacência: " + e.getMessage());
            return false;
        } catch (NumberFormatException e) {
            System.err.println("Erro de conversão numérica ao ler a matriz de adjacência. Verifique se os valores são numéricos.");
            return false;
        }
    }

    public boolean carregarMatrizAdjacencia() {
        File caminhoNoProjeto = new File("src" + File.separator + "AdjacencyMatrix.txt");
        File caminhoNaRaiz = new File("AdjacencyMatrix.txt");
        File arquivo = caminhoNoProjeto.isFile() ? caminhoNoProjeto : caminhoNaRaiz;
        return carregarMatrizAdjacencia(arquivo.getPath());
    }

    public static Grafo carregarGrafo(String caminhoArquivo) {
        RedeFerroviaria rede = new RedeFerroviaria();
        if (!rede.carregarMatrizAdjacencia(caminhoArquivo)) {
            return null;
        }
        return rede.criarGrafo();
    }

    public static Grafo carregarGrafo() {
        RedeFerroviaria rede = new RedeFerroviaria();
        if (!rede.carregarMatrizAdjacencia()) {
            return null;
        }
        return rede.criarGrafo();
    }

    public Grafo criarGrafo() {
        Grafo grafo = new Grafo(new ArrayList<>(cidades));
        for (LinhaFerrea linha : linhasFerreas) {
            grafo.adicionarAresta(linha.getNome(), linha.getCusto(), linha.getOrigem(), linha.getDestino());
        }
        return grafo;
    }

    public void salvarMatrizAdjacencia(String caminhoArquivo) {
        try {
            File arquivo = new File(caminhoArquivo);
            File diretorio = arquivo.getParentFile();
            if (diretorio != null && !diretorio.exists()) {
                diretorio.mkdirs();
            }

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(arquivo))) {
                if (cidades.isEmpty()) {
                    writer.write("");
                    return;
                }

                writer.write("\t");
                for (Town cidade : cidades) {
                    writer.write(cidade.getName() + "\t");
                }
                writer.newLine();

                double[][] matriz = gerarMatrizAdjacencia();
                for (int i = 0; i < cidades.size(); i++) {
                    writer.write(cidades.get(i).getName() + "\t");
                    for (int j = 0; j < cidades.size(); j++) {
                        writer.write(String.format(Locale.US, "%.0f", matriz[i][j]));
                        if (j < cidades.size() - 1) {
                            writer.write("\t");
                        }
                    }
                    writer.newLine();
                }
            }

            System.out.println("Matriz de adjacência guardada com sucesso em: " + caminhoArquivo);
        } catch (IOException e) {
            System.err.println("Erro ao guardar a matriz de adjacência em " + caminhoArquivo + ": " + e.getMessage());
        }
    }

    public Map<String, List<String>> criarListaAdjacencia() {
        Map<String, List<String>> listaAdjacencia = new LinkedHashMap<>();

        for (Town cidade : cidades) {
            List<String> ligacoes = new ArrayList<>();
            for (LinhaFerrea linha : cidade.getVizinhos()) {
                ligacoes.add(linha.getDestino().getName() + " (" + linha.getCusto() + " km)");
            }
            listaAdjacencia.put(cidade.getName(), ligacoes);
        }

        return listaAdjacencia;
    }

    public double[][] gerarMatrizAdjacencia() {
        int n = cidades.size();
        double[][] matriz = new double[n][n];

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                matriz[i][j] = 0;
            }
        }

        for (int i = 0; i < n; i++) {
            Town cidadeOrigem = cidades.get(i);
            for (LinhaFerrea linha : cidadeOrigem.getVizinhos()) {
                int j = cidades.indexOf(linha.getDestino());
                if (j >= 0) {
                    matriz[i][j] = linha.getCusto();
                }
            }
        }
        return matriz;
    }

    public void imprimirMatrizAdjacencia() {
        System.out.println("\n=== MATRIZ DE ADJACÊNCIAS (Distâncias em KM) ===");
        double[][] matriz = gerarMatrizAdjacencia();
        int n = cidades.size();

        System.out.printf("%-15s", "");
        for (Town c : cidades) {
            System.out.printf("%-12s", c.getName().substring(0, Math.min(10, c.getName().length())));
        }
        System.out.println();

        for (int i = 0; i < n; i++) {
            System.out.printf("%-15s", cidades.get(i).getName());
            for (int j = 0; j < n; j++) {
                System.out.printf("%-12.1f", matriz[i][j]);
            }
            System.out.println();
        }
    }

    public void imprimirListaAdjacencia() {
        System.out.println("\n=== LISTAS DE ADJACÊNCIAS ===");
        Map<String, List<String>> listaAdjacencia = criarListaAdjacencia();
        for (Map.Entry<String, List<String>> entrada : listaAdjacencia.entrySet()) {
            System.out.print(entrada.getKey() + " -> ");
            if (entrada.getValue().isEmpty()) {
                System.out.println("[]");
            } else {
                System.out.println(String.join(", ", entrada.getValue()));
            }
        }
    }

    public List<Town> getCidades() { return cidades; }
    public List<LinhaFerrea> getLinhasFerreas() { return linhasFerreas; }
}