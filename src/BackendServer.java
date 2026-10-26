import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class BackendServer {
    private static final int DEFAULT_PORT = 8080;

    public static void main(String[] args) throws IOException {
        Path webRoot = resolveWebRoot();
        int port = args.length > 0 ? Integer.parseInt(args[0]) : DEFAULT_PORT;

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
        server.createContext("/", exchange -> serveFile(exchange, webRoot));
        server.start();

        System.out.println("Servidor do mapa disponível em http://localhost:" + port + "/");
        System.out.println("Pasta Web: " + webRoot);
        System.out.println("Prima Ctrl+C para parar o servidor.");
    }

    private static Path resolveWebRoot() throws IOException {
        Path projectSource = Paths.get("src").toAbsolutePath().normalize();
        if (Files.isRegularFile(projectSource.resolve("RussianRailRoad.html"))) {
            return projectSource;
        }

        Path currentDirectory = Paths.get(".").toAbsolutePath().normalize();
        if (Files.isRegularFile(currentDirectory.resolve("RussianRailRoad.html"))) {
            return currentDirectory;
        }

        throw new IOException("Não foi possível encontrar src/RussianRailRoad.html. Execute o servidor na pasta do projeto.");
    }

    private static void serveFile(HttpExchange exchange, Path webRoot) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod()) && !"HEAD".equals(exchange.getRequestMethod())) {
            exchange.getResponseHeaders().set("Allow", "GET, HEAD");
            exchange.sendResponseHeaders(405, -1);
            exchange.close();
            return;
        }

        String requestPath = exchange.getRequestURI().getPath();
        if (requestPath == null || "/".equals(requestPath)) {
            requestPath = "/RussianRailRoad.html";
        }

        Path file = webRoot.resolve(requestPath.substring(1)).normalize();
        if (!file.startsWith(webRoot) || !Files.isRegularFile(file)) {
            byte[] body = "Not found".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
            exchange.sendResponseHeaders(404, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
            return;
        }

        exchange.getResponseHeaders().set("Content-Type", contentType(file));
        exchange.getResponseHeaders().set("Referrer-Policy", "strict-origin-when-cross-origin");

        if ("HEAD".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
            return;
        }

        byte[] body = Files.readAllBytes(file);
        exchange.sendResponseHeaders(200, body.length);
        exchange.getResponseBody().write(body);
        exchange.close();
    }

    private static String contentType(Path file) {
        String name = file.getFileName().toString().toLowerCase();
        if (name.endsWith(".html")) return "text/html; charset=utf-8";
        if (name.endsWith(".css")) return "text/css; charset=utf-8";
        if (name.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (name.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }
}
