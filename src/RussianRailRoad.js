const state = {

    selectedOblasts: [],

    selectedRailroads: [],

    currentAlgorithm: null,

    currentView: "map",

    contextTarget: null
};

const map = L.map(
    "network",
    {
        zoomControl: true
    }
).setView(
    [49.0, 32.0],
    6
);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution:
            "© OpenStreetMap"
    }
).addTo(map);

const oblasts = [

{
id:"Zhytomyr",
coords:[50.2547,28.6587]
},

{
id:"Vinnytsia",
coords:[49.2331,28.4682]
},

{
id:"Kyiv",
coords:[50.4501,30.5234]
},

{
id:"Chernihiv",
coords:[51.4982,31.2893]
},

{
id:"Poltava",
coords:[49.5883,34.5514]
},

{
id:"Sumy",
coords:[50.9077,34.7981]
},

{
id:"Kharkiv",
coords:[49.9935,36.2304]
},

{
id:"Kropyvnytskyi",
coords:[48.5079,32.2623]
},

{
id:"Dnipro",
coords:[48.4647,35.0462]
},

{
id:"Zaporizhzhia",
coords:[47.8388,35.1396]
},

{
id:"Donetsk",
coords:[48.0159,37.8029]
},

{
id:"Luhansk",
coords:[48.5740,39.3078]
},

{
id:"Kherson",
coords:[46.6354,32.6169]
},

{
id:"Mykolaiv",
coords:[46.9750,31.9946]
},

{
id:"Odessa",
coords:[46.4825,30.7233]
},

{
id:"Crimea",
coords:[45.3453,34.4992]
}

];

const railroads = [

["Zhytomyr","Vinnytsia"],
["Zhytomyr","Kyiv"],

["Vinnytsia","Kyiv"],
["Vinnytsia","Kropyvnytskyi"],
["Vinnytsia","Mykolaiv"],

["Kyiv","Chernihiv"],
["Kyiv","Poltava"],

["Kropyvnytskyi","Poltava"],
["Kropyvnytskyi","Dnipro"],
["Kropyvnytskyi","Kherson"],
["Kropyvnytskyi","Mykolaiv"],
["Kropyvnytskyi","Zaporizhzhia"],

["Mykolaiv","Odessa"],
["Mykolaiv","Kherson"],

["Poltava","Dnipro"],
["Poltava","Sumy"],
["Poltava","Kharkiv"],

["Sumy","Kharkiv"],
["Chernihiv","Sumy"],

["Dnipro","Kharkiv"],
["Dnipro","Donetsk"],
["Dnipro","Zaporizhzhia"],

["Zaporizhzhia","Kherson"],
["Zaporizhzhia","Donetsk"],

["Kharkiv","Donetsk"],
["Kharkiv","Luhansk"],

["Donetsk","Luhansk"],

["Kherson","Crimea"]

];

const markerMap = {};

oblasts.forEach(oblast => {

    const marker =
        L.marker(
            oblast.coords
        ).addTo(map);

    marker.bindTooltip(
        oblast.id
    );

    marker.on(
        "click",
        () => {
            selectOblast(
                oblast.id
            );
        }
    );

    marker.on(
        "contextmenu",
        event => {
            openContextMenu(
                event.originalEvent,
                oblast
            );
        }
    );

    markerMap[
        oblast.id
    ] = marker;
});

railroads.forEach(
railroad => {

    const start =
        oblasts.find(
            o =>
            o.id === railroad[0]
        );

    const end =
        oblasts.find(
            o =>
            o.id === railroad[1]
        );

    const line =
        L.polyline(

            [
                start.coords,
                end.coords
            ],

            {
                weight: 4,
                color: "#202124"
            }

        ).addTo(map);

    line.on(
        "click",
        () => {

            selectRailroad(
                railroad
            );
        }
    );

});

function selectOblast(id){

    state.selectedOblasts = [id];

    showToast(
        `${id} selected`
    );
}

function selectRailroad(edge){

    state.selectedRailroads = [edge];

    showToast(
        "Railroad selected"
    );
}

document
.getElementById("fab")
.addEventListener(
"click",
() => {

document
.getElementById(
"fab-menu"
)
.classList.toggle(
"visible"
);

});

function openContextMenu(
event,
target
){

event.preventDefault();

state.contextTarget =
target;

const menu =
document.getElementById(
"context-menu"
);

menu.style.left =
`${event.pageX}px`;

menu.style.top =
`${event.pageY}px`;

menu.style.display =
"block";
}

document.addEventListener(
"click",
() => {

document
.getElementById(
"context-menu"
)
.style.display =
"none";

});

document
.getElementById(
"new-oblast-btn"
)
.addEventListener(
"click",
() => {

document
.getElementById(
"oblast-modal"
)
.style.display =
"flex";

});
document
.getElementById(
"new-railroad-btn"
)
.addEventListener(
"click",
() => {

document
.getElementById(
"railroad-modal"
)
.style.display =
"flex";

});

document
.querySelectorAll(
"#toolbar button"
)
.forEach(button => {

button
.addEventListener(
"click",

() => {

state.currentView =
button.dataset.view;

console.log(
state.currentView
);

});
});

async function checkServer(){

try{

const response =
await fetch(
"http://localhost:8080/api/health"
);

if(response.ok){

document
.getElementById(
"server-status"
)
textContent =
"Connected";

}

}
catch{

document
.getElementById(
"server-status"
)
.textContent =
"Disconnected";

}
}

checkServer();

function showToast(
message
){

const toast =
document.createElement(
"div"
);

toast.className =
"toast";

toast.textContent =
message;

document
.getElementById(
"toast-container"
)
.appendChild(
toast
);

setTimeout(
() => toast.remove(),
3000
);

}

document
.querySelectorAll(
"[data-algorithm]"
)
.forEach(button => {

button.addEventListener(
"click",
() => {

state.currentAlgorithm =
button.dataset.algorithm;

showToast(
`Selected ${state.currentAlgorithm}`
);

});
});