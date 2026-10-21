package Objects;

public class LinhaFerrea {
    private String nome;
    private float distanciaKm;
    private Town origem,
        destino;
//troquei Destino para destino prq tava das issues
<<<<<<< HEAD
public LinhaFerrea(String nome, float custo, Town origem, Town destino){
=======
   public LinhaFerrea(String nome, float custo, Town origem, Town destino){
/* ter Linha Ferrea como privado estava a criar error na classe caminhoMinimo
entao tornei public, para devolver ao estado anterior e so apagar o em cima e
tirar de comentario o embaixo*/
    //LinhaFerrea(String nome, float custo, Town origem, Town destino){
>>>>>>> 2cd43e84b89abee65baaedb374a64b2d8f1d4c2d
        this.nome=nome;
        this.distanciaKm=custo;
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
}
