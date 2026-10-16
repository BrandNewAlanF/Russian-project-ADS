package Objects;

public class LinhaFerrea {
    private String nome;
    private float custo;
    private Town origem,
        destino;
//troquei Destino para destino prq tava das issues
    LinhaFerrea(String nome, float custo, Town origem, Town destino){
        this.nome=nome;
        this.custo=custo;
        this.origem= origem;
        this.destino= destino;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public float getCusto() {
        return custo;
    }

    public void setCusto(float custo) {
        this.custo = custo;
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
}
