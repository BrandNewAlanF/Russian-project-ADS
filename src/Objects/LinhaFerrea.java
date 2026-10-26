package Objects;

public class LinhaFerrea {
    private String nome;
    private float distanciaKm;
    private Town origem;
    private Town destino;

    public LinhaFerrea(String nome, float custo, Town origem, Town destino) {
        this.nome = nome;
        this.distanciaKm = custo;
        this.origem = origem;
        this.destino = destino;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public float getCusto() {
        return distanciaKm;
    }

    public void setCusto(float custo) {
        this.distanciaKm = custo;
    }

    public Town getOrigem() {
        return origem;
    }

    public void setOrigem(Town origem) {
        this.origem = origem;
    }

    public Town getDestino() {
        return destino;
    }

    public void setDestino(Town destino) {
        this.destino = destino;
    }

    @Override
    public String toString() {
        return nome + ": " + origem.getName() + " -> " + destino.getName()
                + " (" + distanciaKm + " km)";
    }
}
