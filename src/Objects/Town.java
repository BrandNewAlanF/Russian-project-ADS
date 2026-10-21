package Objects;

import java.util.ArrayList;
import java.util.List;

public class Town {
    private String name;
    private List<LinhaFerrea> vizinhos;

    public Town(String name){
        this.name=name;
        this.vizinhos= new ArrayList<>();
    }

    Town(){
        this("");
    }

    public String getName() {return name;}
    public void setName(String name){this.name=name;}

    public List<LinhaFerrea> getVizinhos(){ return vizinhos;}
}