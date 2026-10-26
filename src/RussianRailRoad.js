(function () {
    "use strict";

    const nodes = [
        { id: "A", name: "Zhytomyr", lat: 50.2547, lng: 28.6587 },
        { id: "B", name: "Vinnytsia", lat: 49.2331, lng: 28.4682 },
        { id: "C", name: "Kyiv", lat: 50.4501, lng: 30.5234 },
        { id: "D", name: "Chernihiv", lat: 51.4982, lng: 31.2893 },
        { id: "E", name: "Poltava", lat: 49.5883, lng: 34.5514 },
        { id: "F", name: "Sumy", lat: 50.9077, lng: 34.7981 },
        { id: "G", name: "Kharkiv", lat: 49.9935, lng: 36.2304 },
        { id: "H", name: "Kropyvnytskyi", lat: 48.5079, lng: 32.2623 },
        { id: "I", name: "Dnipro", lat: 48.4647, lng: 35.0462 },
        { id: "J", name: "Zaporizhzhia", lat: 47.8388, lng: 35.1396 },
        { id: "K", name: "Donetsk", lat: 48.0159, lng: 37.8029 },
        { id: "L", name: "Luhansk", lat: 48.5740, lng: 39.3078 },
        { id: "M", name: "Kherson", lat: 46.6354, lng: 32.6169 },
        { id: "N", name: "Mykolaiv", lat: 46.9750, lng: 31.9946 },
        { id: "O", name: "Odessa", lat: 46.4825, lng: 30.7233 },
        { id: "P", name: "Crimea", lat: 45.3453, lng: 34.4992 }
    ];

    const weightedConnections = [
        ["A", "B", 114], ["A", "C", 139],
        ["B", "C", 200], ["B", "D", 238], ["B", "E", 361],
        ["C", "G", 142], ["C", "H", 340],
        ["D", "E", 195], ["D", "H", 206], ["D", "I", 205], ["D", "J", 210], ["D", "N", 224],
        ["E", "F", 122], ["E", "J", 61],
        ["G", "K", 180],
        ["H", "K", 148], ["H", "L", 129],
        ["I", "L", 191], ["I", "M", 210], ["I", "N", 69],
        ["J", "N", 219], ["J", "O", 220],
        ["K", "L", 142],
        ["L", "P", 274],
        ["M", "N", 201], ["M", "P", 247]
    ];

    const edges = weightedConnections.map(function (connection, index) {
        return {
            id: "edge-" + (index + 1),
            source: connection[0],
            target: connection[1],
            distance: connection[2]
        };
    });

    const nodeById = new Map(nodes.map(function (node) { return [node.id, node]; }));
    const adjacency = new Map(nodes.map(function (node) { return [node.id, []]; }));
    edges.forEach(function (edge) {
        adjacency.get(edge.source).push({ node: edge.target, edge: edge });
        adjacency.get(edge.target).push({ node: edge.source, edge: edge });
    });

    const state = {
        view: "map",
        matrixMode: "adjacency",
        query: "",
        focusNode: "",
        connectionFilter: "all",
        minDistance: "",
        maxDistance: "",
        selectedNodes: new Set(),
        selectedEdges: new Set(),
        routeNodeIds: new Set(),
        routeEdgeIds: new Set(),
        visual: { visited: new Set(), current: null, pathNodes: new Set(), pathEdges: new Set() },
        animationTimer: null
    };

    const mapMarkers = new Map();
    const mapLines = new Map();
    let map = null;
    let cy = null;
    let mapTileErrors = 0;
    let mapTileErrorNotified = false;

    function setMapStatus(message, stateName) {
        const status = byId("map-status");
        status.classList.remove("is-loading", "is-error");
        if (stateName) status.classList.add(stateName);
        status.querySelector("span:last-child").textContent = message;
    }

    function byId(id) {
        return document.getElementById(id);
    }

    function edgeIdBetween(source, target) {
        const edge = edges.find(function (item) {
            return (item.source === source && item.target === target) ||
                (item.source === target && item.target === source);
        });
        return edge ? edge.id : null;
    }

    function formatDistance(distance) {
        return new Intl.NumberFormat("pt-PT").format(distance) + " km";
    }

    function getDegree(nodeId) {
        return adjacency.get(nodeId).length;
    }

    function getVisibleData() {
        const query = state.query.trim().toLocaleLowerCase();
        const routeQuery = query.split(/\s*(?:->|→|\bto\b)\s*/i).length === 2;
        const min = state.minDistance === "" ? null : Number(state.minDistance);
        const max = state.maxDistance === "" ? null : Number(state.maxDistance);
        const matchingNodeIds = new Set(nodes.filter(function (node) {
            return routeQuery ? state.routeNodeIds.has(node.id) :
                !query || node.name.toLocaleLowerCase().includes(query);
        }).map(function (node) { return node.id; }));

        const visibleEdges = edges.filter(function (edge) {
            const source = nodeById.get(edge.source);
            const target = nodeById.get(edge.target);
            const queryMatches = routeQuery ? state.routeEdgeIds.has(edge.id) :
                !query ||
                source.name.toLocaleLowerCase().includes(query) ||
                target.name.toLocaleLowerCase().includes(query);
            const focusMatches = !state.focusNode ||
                edge.source === state.focusNode || edge.target === state.focusNode;
            const minMatches = min === null || edge.distance >= min;
            const maxMatches = max === null || edge.distance <= max;
            return queryMatches && focusMatches && minMatches && maxMatches;
        });

        const connectedNodeIds = new Set();
        visibleEdges.forEach(function (edge) {
            connectedNodeIds.add(edge.source);
            connectedNodeIds.add(edge.target);
        });

        const visibleNodes = nodes.filter(function (node) {
            const queryMatches = routeQuery ? matchingNodeIds.has(node.id) :
                !query || matchingNodeIds.has(node.id) ||
                visibleEdges.some(function (edge) {
                    return edge.source === node.id || edge.target === node.id;
                });
            const focusMatches = !state.focusNode || node.id === state.focusNode ||
                visibleEdges.some(function (edge) {
                    return edge.source === node.id || edge.target === node.id;
                });
            const connectionMatches = state.connectionFilter === "all" ||
                (state.connectionFilter === "connected" && getDegree(node.id) > 0) ||
                (state.connectionFilter === "isolated" && getDegree(node.id) === 0);
            const hasConnectionsInFilteredRange = min === null && max === null || connectedNodeIds.has(node.id);
            return queryMatches && focusMatches && connectionMatches && hasConnectionsInFilteredRange;
        });
        const visibleNodeIds = new Set(visibleNodes.map(function (node) { return node.id; }));
        return {
            nodes: visibleNodes,
            edges: visibleEdges.filter(function (edge) {
                return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
            })
        };
    }

    function initializeMap() {
        if (!window.L) {
            byId("map-canvas").innerHTML = '<div class="dependency-message"><strong>Biblioteca do mapa indisponível</strong><span>Ligue-se à Internet e volte a carregar a página para carregar o Leaflet e os mapas do OpenStreetMap. Pode continuar a utilizar as vistas de grafo, matriz e lista.</span></div>';
            setMapStatus("Leaflet indisponível", "is-error");
            return;
        }

        map = L.map("map-canvas", { zoomControl: false, preferCanvas: true }).setView([48.8, 32.4], 6);
        L.control.zoom({ position: "bottomright" }).addTo(map);
        const baseMap = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        baseMap.on("loading", function () {
            mapTileErrors = 0;
            setMapStatus("A carregar mapa…", "is-loading");
        });
        baseMap.on("tileerror", function () {
            mapTileErrors += 1;
            setMapStatus("Acesso ao mapa indisponível", "is-error");
            if (!mapTileErrorNotified) {
                mapTileErrorNotified = true;
                showToast("Não foi possível carregar o mapa online. Verifique o acesso à Internet e tente novamente.");
            }
        });
        baseMap.on("load", function () {
            if (mapTileErrors === 0) setMapStatus("Mapa online", "");
        });

        edges.forEach(function (edge) {
            const source = nodeById.get(edge.source);
            const target = nodeById.get(edge.target);
            const line = L.polyline([[source.lat, source.lng], [target.lat, target.lng]], {
                color: "#718096",
                weight: 3,
                opacity: 0.72,
                lineCap: "round"
            }).addTo(map);
            line.bindTooltip(source.name + " – " + target.name + " · " + formatDistance(edge.distance));
            line.on("click", function (event) {
                selectEdge(edge.id, event.originalEvent);
            });
            mapLines.set(edge.id, line);
        });

        nodes.forEach(function (node) {
            const marker = L.circleMarker([node.lat, node.lng], {
                radius: 7,
                color: "#ffffff",
                weight: 2,
                fillColor: "#315ee8",
                fillOpacity: 1
            }).addTo(map);
            marker.bindTooltip(node.name, { direction: "top", offset: [0, -8] });
            marker.bindPopup("<strong>" + node.name + "</strong><br>" + getDegree(node.id) + " ligações ferroviárias");
            marker.on("click", function (event) {
                selectNode(node.id, event.originalEvent);
            });
            marker.on("contextmenu", function () {
                setRouteEndpoint("source-node", node.id);
                showToast(node.name + " definida como origem do percurso");
            });
            mapMarkers.set(node.id, marker);
        });

        map.fitBounds(L.latLngBounds(nodes.map(function (node) { return [node.lat, node.lng]; })).pad(0.12));
    }

    function initializeGraph() {
        if (!window.cytoscape) {
            byId("graph-canvas").innerHTML = '<div class="dependency-message"><strong>Biblioteca do grafo indisponível</strong><span>Ligue-se à Internet e volte a carregar a página para carregar o Cytoscape.js. As vistas de mapa, matriz e lista continuam disponíveis.</span></div>';
            return;
        }

        const graphElements = nodes.map(function (node) {
            return {
                data: { id: node.id, label: node.name },
                position: { x: node.lng * 100, y: -node.lat * 100 }
            };
        }).concat(edges.map(function (edge) {
            return {
                data: {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    distance: edge.distance,
                    label: edge.distance + " km"
                }
            };
        }));

        cy = cytoscape({
            container: byId("graph-canvas"),
            elements: graphElements,
            layout: { name: "preset", fit: true, padding: 60 },
            minZoom: 0.25,
            maxZoom: 3,
            style: [
                {
                    selector: "node",
                    style: {
                        "background-color": "#315ee8",
                        "border-color": "#ffffff",
                        "border-width": 2,
                        "label": "data(label)",
                        "color": "#182235",
                        "font-size": 11,
                        "font-weight": 600,
                        "text-valign": "bottom",
                        "text-halign": "center",
                        "text-margin-y": 7,
                        "width": 24,
                        "height": 24,
                        "text-background-color": "#ffffff",
                        "text-background-opacity": 0.88,
                        "text-background-padding": 2
                    }
                },
                {
                    selector: "edge",
                    style: {
                        "width": 2,
                        "line-color": "#9ca8bb",
                        "curve-style": "bezier",
                        "label": "data(label)",
                        "font-size": 9,
                        "color": "#58657a",
                        "text-background-color": "#ffffff",
                        "text-background-opacity": 0.9,
                        "text-background-padding": 2
                    }
                },
                { selector: ".is-hidden", style: { "display": "none" } },
                { selector: ".is-selected", style: { "border-color": "#f29c38", "border-width": 5, "line-color": "#f29c38", "width": 5 } },
                { selector: ".is-visited", style: { "background-color": "#70a5f7", "line-color": "#70a5f7" } },
                { selector: ".is-current", style: { "background-color": "#f29c38", "width": 32, "height": 32 } },
                { selector: ".is-path", style: { "background-color": "#21a179", "line-color": "#21a179", "width": 6, "border-color": "#ffffff" } }
            ]
        });

        cy.on("tap", "node", function (event) {
            const originalEvent = event.originalEvent || {};
            selectNode(event.target.id(), originalEvent);
        });
        cy.on("tap", "edge", function (event) {
            const originalEvent = event.originalEvent || {};
            selectEdge(event.target.id(), originalEvent);
        });
    }

    function initializeControls() {
        const options = nodes.map(function (node) {
            return '<option value="' + node.id + '">' + node.name + "</option>";
        }).join("");
        ["source-node", "destination-node", "algorithm-start"].forEach(function (id) {
            byId(id).innerHTML = options;
        });
        byId("source-node").value = "A";
        byId("destination-node").value = "P";
        byId("algorithm-start").value = "A";
        byId("focus-node").insertAdjacentHTML("beforeend", options);

        byId("view-switcher").addEventListener("click", function (event) {
            const button = event.target.closest("[data-view]");
            if (button) setView(button.dataset.view);
        });

        byId("global-search").addEventListener("input", function (event) {
            state.query = event.target.value;
            renderAll();
        });
        byId("global-search").addEventListener("keydown", function (event) {
            if (event.key === "Enter") focusSearchResult();
            if (event.key === "Escape") {
                event.target.value = "";
                state.query = "";
                renderAll();
            }
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "/" && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
                event.preventDefault();
                byId("global-search").focus();
            }
        });

        byId("focus-node").addEventListener("change", function (event) {
            state.focusNode = event.target.value;
            renderAll();
        });
        byId("connection-filter").addEventListener("change", function (event) {
            state.connectionFilter = event.target.value;
            renderAll();
        });
        byId("min-distance").addEventListener("input", updateDistanceFilter);
        byId("max-distance").addEventListener("input", updateDistanceFilter);
        byId("clear-filters").addEventListener("click", clearFilters);
        byId("clear-selection").addEventListener("click", clearSelection);
        byId("run-route-btn").addEventListener("click", planRoute);
        byId("run-algorithm-btn").addEventListener("click", runSelectedAlgorithm);
        byId("adjacency-mode").addEventListener("click", function () { setMatrixMode("adjacency"); });
        byId("weighted-mode").addEventListener("click", function () { setMatrixMode("weighted"); });
        byId("fit-map").addEventListener("click", fitMap);
        byId("fit-graph").addEventListener("click", function () {
            if (cy) cy.fit(cy.elements(":visible"), 60);
        });
        byId("open-sidebar").addEventListener("click", function () {
            document.querySelector(".sidebar").classList.add("is-open");
        });
        byId("sidebar-close").addEventListener("click", function () {
            document.querySelector(".sidebar").classList.remove("is-open");
        });
        byId("station-list").addEventListener("click", function (event) {
            const button = event.target.closest("[data-node-id]");
            if (button) {
                selectNode(button.dataset.nodeId, event);
                setView("map");
            }
        });
        byId("railroad-list").addEventListener("click", function (event) {
            const row = event.target.closest("[data-edge-id]");
            if (row) {
                selectEdge(row.dataset.edgeId, event);
                setView("map");
            }
        });
        byId("matrix-container").addEventListener("click", function (event) {
            const header = event.target.closest("[data-node-id]");
            if (header) {
                state.focusNode = header.dataset.nodeId;
                byId("focus-node").value = state.focusNode;
                renderAll();
            }
        });
    }

    function updateDistanceFilter() {
        state.minDistance = byId("min-distance").value;
        state.maxDistance = byId("max-distance").value;
        renderAll();
    }

    function clearFilters() {
        state.query = "";
        state.focusNode = "";
        state.connectionFilter = "all";
        state.minDistance = "";
        state.maxDistance = "";
        byId("global-search").value = "";
        byId("focus-node").value = "";
        byId("connection-filter").value = "all";
        byId("min-distance").value = "";
        byId("max-distance").value = "";
        renderAll();
    }

    function setView(view) {
        state.view = view;
        document.querySelectorAll(".view-tab").forEach(function (button) {
            const active = button.dataset.view === view;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-selected", String(active));
        });
        document.querySelectorAll(".view-panel").forEach(function (panel) {
            const active = panel.id === view + "-panel";
            panel.hidden = !active;
            panel.classList.toggle("is-visible", active);
        });
        if (view === "map" && map) {
            window.setTimeout(function () { map.invalidateSize(); }, 80);
        }
        if (view === "graph" && cy) {
            window.setTimeout(function () { cy.resize(); cy.fit(cy.elements(":visible"), 50); }, 80);
        }
        if (window.innerWidth <= 760) {
            document.querySelector(".sidebar").classList.remove("is-open");
        }
    }

    function renderAll() {
        const visible = getVisibleData();
        renderMap(visible);
        renderGraph(visible);
        renderMatrix();
        renderList(visible);
        renderSelectionSummary();
        renderFilterSummary(visible);
    }

    function renderMap(visible) {
        if (!map) return;
        const visibleNodeIds = new Set(visible.nodes.map(function (node) { return node.id; }));
        const visibleEdgeIds = new Set(visible.edges.map(function (edge) { return edge.id; }));

        mapLines.forEach(function (line, edgeId) {
            const edge = edges.find(function (item) { return item.id === edgeId; });
            const selected = state.selectedEdges.has(edgeId);
            const path = state.routeEdgeIds.has(edgeId) || state.visual.pathEdges.has(edgeId);
            const shown = visibleEdgeIds.has(edgeId) || path;
            line.setStyle({
                color: path ? "#21a179" : selected ? "#f29c38" : "#718096",
                weight: path ? 6 : selected ? 5 : 3,
                opacity: shown ? 0.88 : 0.08
            });
            if (shown) line.bringToFront();
        });

        mapMarkers.forEach(function (marker, nodeId) {
            const selected = state.selectedNodes.has(nodeId);
            const visited = state.visual.visited.has(nodeId);
            const path = state.routeNodeIds.has(nodeId) || state.visual.pathNodes.has(nodeId);
            const current = state.visual.current === nodeId;
            marker.setStyle({
                color: selected ? "#f29c38" : "#ffffff",
                weight: selected ? 4 : 2,
                fillColor: path ? "#21a179" : current ? "#f29c38" : visited ? "#70a5f7" : "#315ee8",
                fillOpacity: visibleNodeIds.has(nodeId) ? 1 : 0.2,
                opacity: visibleNodeIds.has(nodeId) ? 1 : 0.25,
                radius: selected || current ? 9 : 7
            });
        });
    }

    function renderGraph(visible) {
        if (!cy) return;
        const visibleNodeIds = new Set(visible.nodes.map(function (node) { return node.id; }));
        const visibleEdgeIds = new Set(visible.edges.map(function (edge) { return edge.id; }));
        cy.batch(function () {
            cy.nodes().forEach(function (element) {
                const id = element.id();
                element.toggleClass("is-hidden", !visibleNodeIds.has(id));
                element.toggleClass("is-selected", state.selectedNodes.has(id));
                element.toggleClass("is-visited", state.visual.visited.has(id));
                element.toggleClass("is-current", state.visual.current === id);
                element.toggleClass("is-path", state.routeNodeIds.has(id) || state.visual.pathNodes.has(id));
            });
            cy.edges().forEach(function (element) {
                const id = element.id();
                element.toggleClass("is-hidden", !visibleEdgeIds.has(id) &&
                    !state.routeEdgeIds.has(id) && !state.visual.pathEdges.has(id));
                element.toggleClass("is-selected", state.selectedEdges.has(id));
                element.toggleClass("is-visited", state.visual.visited.has(element.source().id()) &&
                    state.visual.visited.has(element.target().id()));
                element.toggleClass("is-path", state.routeEdgeIds.has(id) || state.visual.pathEdges.has(id));
            });
        });
    }

    function renderMatrix() {
        const container = byId("matrix-container");
        const headerCells = nodes.map(function (node) {
            return '<th scope="col"><button class="matrix-node-button" type="button" data-node-id="' +
                node.id + '" title="Destacar ' + node.name + '">' + node.name + "</button></th>";
        }).join("");
        const rows = nodes.map(function (rowNode) {
            const cells = nodes.map(function (columnNode) {
                const edge = edges.find(function (item) {
                    return (item.source === rowNode.id && item.target === columnNode.id) ||
                        (item.source === columnNode.id && item.target === rowNode.id);
                });
                const value = rowNode.id === columnNode.id || !edge ? "0" :
                    state.matrixMode === "weighted" ? edge.distance : "1";
                const title = edge ? rowNode.name + " – " + columnNode.name + ": " + formatDistance(edge.distance) :
                    rowNode.id === columnNode.id ? "Mesma estação" : edge ? "Ligação ferroviária direta" : "Sem ligação ferroviária direta";
                return '<td title="' + title + '" class="' + (edge ? "has-connection" : "") + '">' + value + "</td>";
            }).join("");
            return '<tr><th scope="row"><button class="matrix-node-button row-node-button" type="button" data-node-id="' +
                rowNode.id + '">' + rowNode.name + "</button></th>" + cells + "</tr>";
        }).join("");
        container.innerHTML = '<table class="matrix-table"><thead><tr><th scope="col">Estação</th>' +
            headerCells + "</tr></thead><tbody>" + rows + "</tbody></table>";
        byId("adjacency-mode").classList.toggle("is-active", state.matrixMode === "adjacency");
        byId("weighted-mode").classList.toggle("is-active", state.matrixMode === "weighted");
        byId("adjacency-mode").setAttribute("aria-pressed", String(state.matrixMode === "adjacency"));
        byId("weighted-mode").setAttribute("aria-pressed", String(state.matrixMode === "weighted"));
        byId("matrix-panel").querySelector("h2").textContent =
            state.matrixMode === "weighted" ? "Matriz ponderada" : "Matriz de adjacência";
    }

    function renderList(visible) {
        byId("station-list").innerHTML = visible.nodes.map(function (node) {
            return '<button class="station-card ' + (state.selectedNodes.has(node.id) ? "is-selected" : "") +
                '" type="button" data-node-id="' + node.id + '"><span class="station-card-dot"></span>' +
                "<span><strong>" + node.name + "</strong><small>" + getDegree(node.id) + " ligações</small></span>" +
                '<span class="station-card-arrow">→</span></button>';
        }).join("") || '<p class="empty-state">Nenhuma estação corresponde aos filtros atuais.</p>';

        byId("railroad-list").innerHTML = visible.edges.map(function (edge) {
            const source = nodeById.get(edge.source);
            const target = nodeById.get(edge.target);
            return '<tr data-edge-id="' + edge.id + '" class="' + (state.selectedEdges.has(edge.id) ? "is-selected" : "") +
                '"><td><span class="table-line-icon"></span>Linha ferroviária ' + String(edges.indexOf(edge) + 1).padStart(2, "0") +
                "</td><td>" + source.name + "</td><td>" + target.name + "</td><td>" +
                formatDistance(edge.distance) + "</td></tr>";
        }).join("") || '<tr><td colspan="4" class="empty-state">Nenhuma linha ferroviária corresponde aos filtros atuais.</td></tr>';

        byId("station-count").textContent = "(" + visible.nodes.length + ")";
        byId("railroad-count").textContent = "(" + visible.edges.length + ")";
        byId("list-count").textContent = visible.nodes.length + " estações · " + visible.edges.length + " linhas";
    }

    function renderSelectionSummary() {
        const selectedNodeNames = Array.from(state.selectedNodes).map(function (id) {
            return nodeById.get(id).name;
        });
        const selectedEdgeCount = state.selectedEdges.size;
        if (!selectedNodeNames.length && !selectedEdgeCount) {
            byId("selection-summary").textContent = "Não foram selecionadas estações nem linhas";
            return;
        }
        const parts = [];
        if (selectedNodeNames.length) parts.push(selectedNodeNames.join(", "));
        if (selectedEdgeCount) parts.push(selectedEdgeCount + " " + (selectedEdgeCount === 1 ? "linha" : "linhas"));
        byId("selection-summary").textContent = parts.join(" · ");
    }

    function renderFilterSummary(visible) {
        const filtered = state.query || state.focusNode || state.connectionFilter !== "all" ||
            state.minDistance !== "" || state.maxDistance !== "";
        byId("filter-summary").textContent = filtered ?
            "A mostrar " + visible.nodes.length + " de " + nodes.length + " estações · " +
                visible.edges.length + " de " + edges.length + " linhas" :
            "A mostrar todas as " + nodes.length + " estações e as " + edges.length + " linhas";
    }

    function setMatrixMode(mode) {
        state.matrixMode = mode;
        renderMatrix();
    }

    function selectNode(nodeId, event) {
        const additive = event && (event.ctrlKey || event.metaKey || event.shiftKey);
        if (!additive) {
            state.selectedNodes.clear();
            state.selectedEdges.clear();
        }
        if (additive && state.selectedNodes.has(nodeId)) state.selectedNodes.delete(nodeId);
        else state.selectedNodes.add(nodeId);
        byId("algorithm-start").value = nodeId;
        renderAll();
    }

    function selectEdge(edgeId, event) {
        const additive = event && (event.ctrlKey || event.metaKey || event.shiftKey);
        if (!additive) {
            state.selectedNodes.clear();
            state.selectedEdges.clear();
        }
        if (additive && state.selectedEdges.has(edgeId)) state.selectedEdges.delete(edgeId);
        else state.selectedEdges.add(edgeId);
        renderAll();
    }

    function clearSelection() {
        state.selectedNodes.clear();
        state.selectedEdges.clear();
        renderAll();
    }

    function focusSearchResult() {
        const query = state.query.trim().toLocaleLowerCase();
        if (!query) return;
        const routeParts = query.split(/\s*(?:->|→|\bto\b)\s*/i);
        if (routeParts.length === 2) {
            const origin = nodes.find(function (item) {
                return item.name.toLocaleLowerCase() === routeParts[0];
            });
            const destination = nodes.find(function (item) {
                return item.name.toLocaleLowerCase() === routeParts[1];
            });
            if (origin && destination) {
                byId("source-node").value = origin.id;
                byId("destination-node").value = destination.id;
                state.focusNode = "";
                state.connectionFilter = "all";
                state.minDistance = "";
                state.maxDistance = "";
                byId("focus-node").value = "";
                byId("connection-filter").value = "all";
                byId("min-distance").value = "";
                byId("max-distance").value = "";
                setView("map");
                planRoute();
                return;
            }
        }
        const node = nodes.find(function (item) {
            return item.name.toLocaleLowerCase() === query ||
                item.name.toLocaleLowerCase().includes(query);
        });
        if (node) {
            state.focusNode = node.id;
            byId("focus-node").value = node.id;
            setView("map");
            if (map) map.setView([node.lat, node.lng], Math.max(map.getZoom(), 7));
            selectNode(node.id, null);
            return;
        }
        const railroad = edges.find(function (edge) {
            const label = nodeById.get(edge.source).name + " " + nodeById.get(edge.target).name;
            return label.toLocaleLowerCase().includes(query);
        });
        if (railroad) {
            selectEdge(railroad.id, null);
            setView("map");
        } else {
            showToast("Nenhuma estação ou linha corresponde a essa pesquisa.");
        }
    }

    function setRouteEndpoint(selectId, nodeId) {
        byId(selectId).value = nodeId;
        if (selectId === "source-node" && byId("destination-node").value === nodeId) {
            const alternative = nodes.find(function (node) { return node.id !== nodeId; });
            byId("destination-node").value = alternative.id;
        }
        planRoute();
    }

    function shortestPath(startId, endId) {
        const distances = new Map(nodes.map(function (node) { return [node.id, Infinity]; }));
        const previous = new Map();
        const unvisited = new Set(nodes.map(function (node) { return node.id; }));
        distances.set(startId, 0);
        const visitedOrder = [];

        while (unvisited.size) {
            let current = null;
            unvisited.forEach(function (id) {
                if (current === null || distances.get(id) < distances.get(current)) current = id;
            });
            if (current === null || distances.get(current) === Infinity) break;
            unvisited.delete(current);
            visitedOrder.push(current);
            if (current === endId) break;

            adjacency.get(current).forEach(function (connection) {
                if (!unvisited.has(connection.node)) return;
                const candidate = distances.get(current) + connection.edge.distance;
                if (candidate < distances.get(connection.node)) {
                    distances.set(connection.node, candidate);
                    previous.set(connection.node, { node: current, edge: connection.edge.id });
                }
            });
        }

        if (distances.get(endId) === Infinity) return null;
        const pathNodes = [];
        const pathEdges = [];
        let cursor = endId;
        pathNodes.unshift(cursor);
        while (cursor !== startId) {
            const step = previous.get(cursor);
            if (!step) return null;
            pathEdges.unshift(step.edge);
            cursor = step.node;
            pathNodes.unshift(cursor);
        }
        return { distance: distances.get(endId), pathNodes: pathNodes, pathEdges: pathEdges, visitedOrder: visitedOrder };
    }

    function planRoute() {
        const startId = byId("source-node").value;
        const endId = byId("destination-node").value;
        if (startId === endId) {
            state.routeNodeIds.clear();
            state.routeEdgeIds.clear();
            byId("route-result").textContent = "Escolha duas estações diferentes para o percurso.";
            renderAll();
            showToast("Escolha duas estações diferentes para o percurso.");
            return;
        }
        const result = shortestPath(startId, endId);
        if (!result) {
            state.routeNodeIds.clear();
            state.routeEdgeIds.clear();
            byId("route-result").textContent = "Não existe um percurso entre estas estações.";
            renderAll();
            return;
        }
        cancelAnimation();
        state.visual = { visited: new Set(), current: null, pathNodes: new Set(), pathEdges: new Set() };
        state.routeNodeIds = new Set(result.pathNodes);
        state.routeEdgeIds = new Set(result.pathEdges);
        const routeNames = result.pathNodes.map(function (id) { return nodeById.get(id).name; });
        const summary = document.createElement("div");
        summary.className = "route-summary";
        const distance = document.createElement("strong");
        distance.textContent = formatDistance(result.distance);
        const path = document.createElement("span");
        path.textContent = routeNames.join("  →  ");
        summary.append(distance, path);
        byId("route-result").replaceChildren(summary);
        byId("algorithm-result").textContent = "Percurso mais curto: " + routeNames.join(" → ") +
            " (" + formatDistance(result.distance) + ").";
        renderAll();
        if (map) {
            const routeCoordinates = result.pathNodes.map(function (id) {
                const node = nodeById.get(id);
                return [node.lat, node.lng];
            });
            map.fitBounds(L.latLngBounds(routeCoordinates).pad(0.35), { maxZoom: 7 });
        }
    }

    function breadthFirstSearch(startId) {
        const visited = new Set([startId]);
        const queue = [startId];
        const order = [];
        while (queue.length) {
            const current = queue.shift();
            order.push(current);
            adjacency.get(current).forEach(function (connection) {
                if (!visited.has(connection.node)) {
                    visited.add(connection.node);
                    queue.push(connection.node);
                }
            });
        }
        return { order: order, pathEdges: [], message: "A pesquisa em largura (BFS) visitou " + order.length + " estações a partir de " + nodeById.get(startId).name + "." };
    }

    function depthFirstSearch(startId) {
        const visited = new Set();
        const order = [];
        function visit(nodeId) {
            visited.add(nodeId);
            order.push(nodeId);
            adjacency.get(nodeId).forEach(function (connection) {
                if (!visited.has(connection.node)) visit(connection.node);
            });
        }
        visit(startId);
        return { order: order, pathEdges: [], message: "A pesquisa em profundidade (DFS) visitou " + order.length + " estações a partir de " + nodeById.get(startId).name + "." };
    }

    function prim(startId) {
        const included = new Set([startId]);
        const order = [startId];
        const selectedEdges = [];
        let total = 0;
        while (included.size < nodes.length) {
            let best = null;
            edges.forEach(function (edge) {
                const sourceIncluded = included.has(edge.source);
                const targetIncluded = included.has(edge.target);
                if (sourceIncluded === targetIncluded) return;
                if (!best || edge.distance < best.distance) best = edge;
            });
            if (!best) break;
            const next = included.has(best.source) ? best.target : best.source;
            included.add(next);
            order.push(next);
            selectedEdges.push(best.id);
            total += best.distance;
        }
        return {
            order: order,
            pathEdges: selectedEdges,
            message: "Prim selecionou " + selectedEdges.length + " linhas · distância total: " + formatDistance(total) + "."
        };
    }

    function kruskal() {
        const parent = new Map(nodes.map(function (node) { return [node.id, node.id]; }));
        function find(nodeId) {
            let root = nodeId;
            while (parent.get(root) !== root) root = parent.get(root);
            while (parent.get(nodeId) !== nodeId) {
                const next = parent.get(nodeId);
                parent.set(nodeId, root);
                nodeId = next;
            }
            return root;
        }
        const selectedEdges = [];
        const order = [];
        let total = 0;
        edges.slice().sort(function (a, b) { return a.distance - b.distance; }).forEach(function (edge) {
            const sourceRoot = find(edge.source);
            const targetRoot = find(edge.target);
            if (sourceRoot === targetRoot || selectedEdges.length >= nodes.length - 1) return;
            parent.set(sourceRoot, targetRoot);
            selectedEdges.push(edge.id);
            if (!order.includes(edge.source)) order.push(edge.source);
            if (!order.includes(edge.target)) order.push(edge.target);
            total += edge.distance;
        });
        return {
            order: order,
            pathEdges: selectedEdges,
            message: "Kruskal selecionou " + selectedEdges.length + " linhas · distância total: " + formatDistance(total) + "."
        };
    }

    function runSelectedAlgorithm() {
        const algorithm = byId("algorithm-select").value;
        const startId = byId("algorithm-start").value;
        let result;
        if (algorithm === "bfs") result = breadthFirstSearch(startId);
        if (algorithm === "dfs") result = depthFirstSearch(startId);
        if (algorithm === "prim") result = prim(startId);
        if (algorithm === "kruskal") result = kruskal();
        if (algorithm === "dijkstra") {
            const endId = byId("destination-node").value;
            if (startId === endId) {
                showToast("Escolha um destino diferente da estação inicial.");
                return;
            }
            const route = shortestPath(startId, endId);
            if (!route) {
                showToast("Não existe um percurso entre estas estações.");
                return;
            }
            result = {
                order: route.visitedOrder,
                pathNodes: route.pathNodes,
                pathEdges: route.pathEdges,
                message: "O algoritmo de Dijkstra encontrou um percurso de " + formatDistance(route.distance) + ": " +
                    route.pathNodes.map(function (id) { return nodeById.get(id).name; }).join(" → ") + "."
            };
        }
        if (result) animateAlgorithm(result);
    }

    function animateAlgorithm(result) {
        cancelAnimation();
        state.routeNodeIds.clear();
        state.routeEdgeIds.clear();
        state.visual = { visited: new Set(), current: null, pathNodes: new Set(), pathEdges: new Set() };
        let index = 0;
        byId("algorithm-result").textContent = "A executar a visualização…";
        renderAll();

        function step() {
            if (index < result.order.length) {
                const nodeId = result.order[index];
                state.visual.current = nodeId;
                state.visual.visited.add(nodeId);
                const edgeId = result.pathEdges && result.pathEdges[index - 1];
                if (edgeId && (byId("algorithm-select").value === "prim" ||
                    byId("algorithm-select").value === "kruskal")) {
                    state.visual.pathEdges.add(edgeId);
                }
                renderAll();
                index += 1;
                state.animationTimer = window.setTimeout(step, 260);
                return;
            }
            (result.pathNodes || []).forEach(function (nodeId) { state.visual.pathNodes.add(nodeId); });
            (result.pathEdges || []).forEach(function (edgeId) { state.visual.pathEdges.add(edgeId); });
            state.visual.current = null;
            byId("algorithm-result").textContent = result.message;
            state.animationTimer = null;
            renderAll();
        }
        step();
    }

    function cancelAnimation() {
        if (state.animationTimer !== null) {
            window.clearTimeout(state.animationTimer);
            state.animationTimer = null;
        }
    }

    function renderStatistics() {
        const totalDistance = edges.reduce(function (sum, edge) { return sum + edge.distance; }, 0);
        let components = 0;
        const visited = new Set();
        nodes.forEach(function (node) {
            if (visited.has(node.id)) return;
            components += 1;
            const queue = [node.id];
            visited.add(node.id);
            while (queue.length) {
                adjacency.get(queue.shift()).forEach(function (connection) {
                    if (!visited.has(connection.node)) {
                        visited.add(connection.node);
                        queue.push(connection.node);
                    }
                });
            }
        });
        byId("stat-nodes").textContent = String(nodes.length);
        byId("stat-edges").textContent = String(edges.length);
        byId("stat-components").textContent = String(components);
        byId("stat-distance").textContent = formatDistance(totalDistance);
        byId("map-count-label").textContent = nodes.length + " estações · " + edges.length + " linhas";
    }

    function fitMap() {
        if (map) map.fitBounds(L.latLngBounds(nodes.map(function (node) { return [node.lat, node.lng]; })).pad(0.12));
    }

    function showToast(message) {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = message;
        byId("toast-container").appendChild(toast);
        window.setTimeout(function () { toast.remove(); }, 3200);
    }

    function initialize() {
        initializeControls();
        initializeMap();
        initializeGraph();
        renderStatistics();
        renderAll();
        window.addEventListener("resize", function () {
            if (map && state.view === "map") map.invalidateSize();
            if (cy && state.view === "graph") cy.resize();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
}());
