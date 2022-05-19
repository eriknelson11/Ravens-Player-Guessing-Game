let http = require("http");
let path = require("path");
let schedule = require('node-schedule');
let fs = require("fs");
let express = require("express"); /* Accessing express module */
let app = express(); /* app is a request handler function */
process.stdin.setEncoding("utf8");
let bodyParser = require("body-parser");
app.use(express.static("public"));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
    extended: false
}));
const nodeFetch = require("node-fetch");
const {
    mainModule
} = require("process");
app.set("views", path.resolve(__dirname));
app.set("view engine", "ejs");
console.log(__dirname);
require("dotenv").config({
    path: path.resolve(__dirname, 'credentials/.env')
})
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const key = process.env.API_KEY;

const databaseAndCollection = {
    db: process.env.MONGO_DB_NAME,
    collection: process.env.MONGO_COLLECTION
};
const {
    MongoClient,
    ServerApiVersion
} = require('mongodb');
const {
    platform
} = require("os");
const uri = `mongodb+srv://${userName}:${password}@cluster0.b2vns.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
});




app.use("/public", express.static('./public/'));

async function getJSONData(url) {
    const result = await nodeFetch(
        url
    );
    const json = await result.json();

    return json;
}

async function getPlayers() {
    try {
        console.log("here");
        const data1 = await getJSONData(`https://api.sportsdata.io/v3/nfl/scores/json/Players/BAL?key=${key}`);
        setInterval(getPlayers, 86400000);
        fs.writeFileSync(`players.json`, JSON.stringify(data1));
        
    } catch (e) {
        console.log("\n***** ERROR players *****\n" + e);
    }
}

getPlayers();



let dailyPlayer = "";
let name = Math.floor(Math.random() * 1000000000);
var data = "";

async function getData() {
    let text = fs.readFileSync(`players.json`, 'utf-8');
    data = JSON.parse(text);
    let filter = {
        name: "list"
    };
    await client.connect();
    const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find(filter);
    const arr = await (await result.toArray());
    
    let res = String(arr[0].players).split(',');
    if (res.length == 80) {
        var reset = {
            $set: {
                players: ","
            }
        };
    await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .updateOne(filter, reset);
            
    };
    
    let index = Math.floor(Math.random() * (92 - 0 + 1));
    while (res.includes(String(index))) {
        index = Math.floor(Math.random() * (92 - 0 + 1));
    }
    var add =  [{ $set: { players: { $concat: [ "$players", `${index},` ] } } }] ;
    await client.connect();
    await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .updateOne(filter, add);
    

    dailyPlayer = data.at(index);
     filter = {
        name: "total"
    };

    var reset = {
        $set: {
            scores: 0,
            entries: 0
        }
    };
    await client.connect();
    await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .updateOne(filter, reset);
    await client.close();
    }
getData();
setInterval(() => {
    let date = new Date();
    let hour = date.getHours();
    let min = date.getMinutes();
    if (hour == 0 && min == 0) {
        getData();
    }
}, 4000);	





app.get("/", async function (request, response) {
    name = Math.floor(Math.random() * 1000000000);
    /*await client.connect();
    await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});*/
    let variables = {
        data: data
    };
   
    response.render("index", variables);
});

app.get("/directions", async function (request, response) {
    response.render("directions");
});
app.post("/ranking", async function (request, response) {
    let filter = {
        name: "total"
    };
    await client.connect();
    const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find(filter);

    const statArr = await (await result.toArray());
    let stat = statArr.find(element => element.name == "total");
    await client.close();
    let avg = stat.scores / stat.entries;
    if (isNaN(avg)) {
        avg = 0;
    }
    let avgStr = "";
    if (avg > 8) {
        avgStr = (`Not Completed`)
    };
    let variables = {
        stats: `<h3 id="subRank"><br>TODAY'S AVERAGE SCORE<br><br></h3>
            <h3 id="avgScore">${avg.toFixed(1) + avgStr}</h3>`
    };
    response.render("ranking", variables);
});


let resultFormat = `<br><div class="label"><p id="position">Pos</p><p id="height">Ht</p><p id="age">Age</p><p id="number">#</p></div>
    <hr>`;
let {
    css1,
    css2,
    css3,
    css4,
    css5,
    css6,
    css7,
    css8
} = "";
let {
    res1,
    res2,
    res3,
    res4,
    res5,
    res6,
    res7,
    res8
} = "";





app.post("/guess1", async (request, response) => {

    let {
        playerGuess

    } = request.body;
    
    let player = data.find(element => element.Name == playerGuess);

    let {
        pname,
        position,
        height,
        age,
        number
    } = "#CDDEEE";

    if (player.Position == dailyPlayer.Position) {
        position = "rgba(0,128,0,.7)";
    } else if (player.PositionCategory == dailyPlayer.PositionCategory) {
        position = "rgba(255, 219, 88,.7)";
    }

    let ph = player.Height.match(/\d+/g);
    let pheight = 12 * parseInt(ph.at(0)) + parseInt(ph.at(1));
    let dph = dailyPlayer.Height.match(/\d+/g);
    let dpheight = 12 * parseInt(dph.at(0)) + parseInt(dph.at(1));
    let htR = "";
    let ageR = "";
    let numbR = "";
     if (pheight < dpheight) {
         htR = `<br>&#8593;`;
    } else if (pheight > dpheight) {
         htR = `<br>&#8595;`;
    } 
    if (parseInt(player.Age) < parseInt(dailyPlayer.Age)) {
        ageR = `<br>&#8593;`;
    } else if (parseInt(player.Age) > parseInt(dailyPlayer.Age)) {
         ageR = `<br>&#8595;`;
    } 
    if (parseInt(player.Number) < parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8593;`;
    } else if (parseInt(player.Number) > parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8595;`;
    }

    if (pheight == dpheight) {
        height = "rgba(0,128,0,.7)";
    } else if ((pheight - dpheight) <= 2 && (pheight - dpheight) > 0) {
        height = "rgba(255, 219, 88,.7)";
        htR = `<br>&#8595;`;
    } else if ((pheight - dpheight) < 0 && (pheight - dpheight) >= -2) {
        htR = `<br>&#8593;`;
        height = "rgba(255, 219, 88,.7)";

    }
    if (parseInt(player.Age) == parseInt(dailyPlayer.Age)) {
        age = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) <= 2 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) > 0) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8595;`;
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) < 0 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) >= -2) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8593;`;
    }
    if (parseInt(player.Number) == parseInt(dailyPlayer.Number)) {
        number = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) <= 2 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) > 0) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8595;`;
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) < 0 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) >= -2) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8593;`;
    }
    if (player.Name == dailyPlayer.Name) {
        pname = "rgba(0,128,0,.7)";
    }
    css1 = `<style>#guess1Name {background-color: ${pname};}#guess1Pos {background-color: ${position};}#guess1Ht {background-color: ${height};}#guess1Age {background-color: ${age};}#guess1Numb {background-color: ${number};}</style>`;
    res1 = getTiles(player, 1, ageR, htR, numbR);

    let text = css1 + resultFormat + res1;


    if (player.Name == dailyPlayer.Name) {

        let variables = {
            results: text,
            data: data,
            completed: `<h3 id="completed">Truzzle completed in 1/8 tries!</h3>`
        };
        let filter = {
            name: "total"
        };

        var newStat = {
            $inc: {
                scores: 1,
                entries: 1
            }
        };
        await client.connect();
        await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .updateOne(filter, newStat);
        await client.close();

        response.render("completed", variables);
    } else {
        let variables = {
            results: text,
            data: data,
            count: `1`,
        };
        response.render("guess1", variables);
    }
});

app.post("/guess2", async (request, response) => {

    let {
        playerGuess
    } = request.body;
    
    let player = data.find(element => element.Name == playerGuess);

    let {
        pname,
        position,
        height,
        age,
        number
    } = "#CDDEEE";


    if (player.PositionCategory == dailyPlayer.PositionCategory) {
        position = "rgba(255, 219, 88,.7)";

    }
    if (player.Position == dailyPlayer.Position) {

        position = "rgba(0,128,0,.7)";
    }
    var regex = /\d+/g;
    let ph = player.Height.match(/\d+/g);
    let pheight = 12 * parseInt(ph.at(0)) + parseInt(ph.at(1));
    let dph = dailyPlayer.Height.match(/\d+/g);
    let dpheight = 12 * parseInt(dph.at(0)) + parseInt(dph.at(1));
    let htR = "";
    let ageR = "";
    let numbR = "";
     if (pheight < dpheight) {
         htR = `<br>&#8593;`;
    } else if (pheight > dpheight) {
         htR = `<br>&#8595;`;
    } 
    if (parseInt(player.Age) < parseInt(dailyPlayer.Age)) {
        ageR = `<br>&#8593;`;
    } else if (parseInt(player.Age) > parseInt(dailyPlayer.Age)) {
         ageR = `<br>&#8595;`;
    } 
    if (parseInt(player.Number) < parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8593;`;
    } else if (parseInt(player.Number) > parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8595;`;
    }

    if (pheight == dpheight) {
        height = "rgba(0,128,0,.7)";
    } else if ((pheight - dpheight) <= 2 && (pheight - dpheight) > 0) {
        height = "rgba(255, 219, 88,.7)";
        htR = `<br>&#8595;`;
    } else if ((pheight - dpheight) < 0 && (pheight - dpheight) >= -2) {
        htR = `<br>&#8593;`;
        height = "rgba(255, 219, 88,.7)";
    }
    if (parseInt(player.Age) == parseInt(dailyPlayer.Age)) {
        age = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) <= 2 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) > 0) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8595;`;
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) < 0 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) >= -2) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8593;`;
    }
    if (parseInt(player.Number) == parseInt(dailyPlayer.Number)) {
        number = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) <= 2 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) > 0) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8595;`;
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) < 0 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) >= -2) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8593;`;
    }
    if (player.Name == dailyPlayer.Name) {
        pname = "rgba(0,128,0,.7)";
    }
    css2 = `<style>#guess2Name {background-color: ${pname};}#guess2Pos {background-color: ${position};}#guess2Ht {background-color: ${height};   }#guess2Age {background-color: ${age};}#guess2Numb {background-color: ${number};}</style>`;
    res2 = getTiles(player, 2, ageR, htR, numbR);

    let text = css1 + css2 + resultFormat + res1 + '<hr>' + res2;
    let variables = {
        results: text,
        data: data,
        count: `2`
    };
    if (player.Name == dailyPlayer.Name) {
        let variables = {
            results: text,
            data: data,
            completed: `<h3 id="completed">Truzzle completed in 2/8 tries!</h3>`
        };
        let filter = {
            name: "total"
        };

        var newStat = {
            $inc: {
                scores: 2,
                entries: 1
            }
        };
        await client.connect();
        await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .updateOne(filter, newStat);
        await client.close();

        response.render("completed", variables);
    } else {
        response.render("guess2", variables);
    }
});

app.post("/guess3", async (request, response) => {
    let {
        playerGuess
    } = request.body;
  
    let player = data.find(element => element.Name == playerGuess);

    let {
        pname,
        position,
        height,
        age,
        number
    } = "#CDDEEE";

    if (player.PositionCategory == dailyPlayer.PositionCategory) {
        position = "rgba(255, 219, 88,.7)";

    }
    if (player.Position == dailyPlayer.Position) {

        position = "rgba(0,128,0,.7)";
    }
    let ph = player.Height.match(/\d+/g);
    let pheight = 12 * parseInt(ph.at(0)) + parseInt(ph.at(1));
    let dph = dailyPlayer.Height.match(/\d+/g);
    let dpheight = 12 * parseInt(dph.at(0)) + parseInt(dph.at(1));
    let htR = "";
    let ageR = "";
    let numbR = "";
     if (pheight < dpheight) {
         htR = `<br>&#8593;`;
    } else if (pheight > dpheight) {
         htR = `<br>&#8595;`;
    } 
    if (parseInt(player.Age) < parseInt(dailyPlayer.Age)) {
        ageR = `<br>&#8593;`;
    } else if (parseInt(player.Age) > parseInt(dailyPlayer.Age)) {
         ageR = `<br>&#8595;`;
    } 
    if (parseInt(player.Number) < parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8593;`;
    } else if (parseInt(player.Number) > parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8595;`;
    }

    if (pheight == dpheight) {
        height = "rgba(0,128,0,.7)";
    } else if ((pheight - dpheight) <= 2 && (pheight - dpheight) > 0) {
        height = "rgba(255, 219, 88,.7)";
        htR = `<br>&#8595;`;
    } else if ((pheight - dpheight) < 0 && (pheight - dpheight) >= -2) {
        htR = `<br>&#8593;`;
        height = "rgba(255, 219, 88,.7)";
    }
    if (parseInt(player.Age) == parseInt(dailyPlayer.Age)) {
        age = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) <= 2 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) > 0) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8595;`;
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) < 0 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) >= -2) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8593;`;
    }
    if (parseInt(player.Number) == parseInt(dailyPlayer.Number)) {
        number = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) <= 2 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) > 0) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8595;`;
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) < 0 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) >= -2) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8593;`;
    }
    if (player.Name == dailyPlayer.Name) {
        pname = "rgba(0,128,0,.7)";
    }
    css3 = `<style>#guess3Name {background-color: ${pname};}#guess3Pos {background-color: ${position};}#guess3Ht {background-color: ${height};   }#guess3Age {background-color: ${age};}#guess3Numb {background-color: ${number};}</style>`;
    res3 = getTiles(player, 3, ageR, htR, numbR);

    let text = css1 + css2 + css3 + resultFormat + res1 + '<hr>' + res2 + '<hr>' + res3;

    let variables = {
        results: text,
        data: data,
        count: `3`
    };
    if (player.Name == dailyPlayer.Name) {
        let variables = {
            results: text,
            data: data,
            completed: `<h3 id="completed">Truzzle completed in 3/8 tries!</h3>`
        };
        let filter = {
            name: "total"
        };

        var newStat = {
            $inc: {
                scores: 3,
                entries: 1
            }
        };
        await client.connect();
        await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .updateOne(filter, newStat);
        
        await client.close();

        response.render("completed", variables);

    } else {
        response.render("guess3", variables);
    }
});

app.post("/guess4", async (request, response) => {

    let {
        playerGuess
    } = request.body;
   
     
    let player = data.find(element => element.Name == playerGuess);

    let {
        pname,
        position,
        height,
        age,
        number
    } = "#CDDEEE";

    if (player.PositionCategory == dailyPlayer.PositionCategory) {
        position = "rgba(255, 219, 88,.7)";

    }
    if (player.Position == dailyPlayer.Position) {

        position = "rgba(0,128,0,.7)";
    }
    let ph = player.Height.match(/\d+/g);
    let pheight = 12 * parseInt(ph.at(0)) + parseInt(ph.at(1));
    let dph = dailyPlayer.Height.match(/\d+/g);
    let dpheight = 12 * parseInt(dph.at(0)) + parseInt(dph.at(1));
    let htR = "";
    let ageR = "";
    let numbR = "";
     if (pheight < dpheight) {
         htR = `<br>&#8593;`;
    } else if (pheight > dpheight) {
         htR = `<br>&#8595;`;
    } 
    if (parseInt(player.Age) < parseInt(dailyPlayer.Age)) {
        ageR = `<br>&#8593;`;
    } else if (parseInt(player.Age) > parseInt(dailyPlayer.Age)) {
         ageR = `<br>&#8595;`;
    } 
    if (parseInt(player.Number) < parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8593;`;
    } else if (parseInt(player.Number) > parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8595;`;
    }

    if (pheight == dpheight) {
        height = "rgba(0,128,0,.7)";
    } else if ((pheight - dpheight) <= 2 && (pheight - dpheight) > 0) {
        height = "rgba(255, 219, 88,.7)";
        htR = `<br>&#8595;`;
    } else if ((pheight - dpheight) < 0 && (pheight - dpheight) >= -2) {
        htR = `<br>&#8593;`;
        height = "rgba(255, 219, 88,.7)";
    }
    if (parseInt(player.Age) == parseInt(dailyPlayer.Age)) {
        age = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) <= 2 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) > 0) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8595;`;
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) < 0 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) >= -2) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8593;`;
    }
    if (parseInt(player.Number) == parseInt(dailyPlayer.Number)) {
        number = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) <= 2 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) > 0) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8595;`;
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) < 0 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) >= -2) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8593;`;
    }
    if (player.Name == dailyPlayer.Name) {
        pname = "rgba(0,128,0,.7)";
    }
    css4 = `<style>#guess4Name {background-color: ${pname};}#guess4Pos {background-color: ${position};}#guess4Ht {background-color: ${height};   }#guess4Age {background-color: ${age};}#guess4Numb {background-color: ${number};}</style>`;
    res4 = getTiles(player, 4, ageR, htR, numbR);

    let text = css1 + css2 + css3 + css4 + resultFormat + res1 + '<hr>' + res2 + '<hr>' + res3 + '<hr>' + res4;

    let variables = {
        results: text,
        data: data,
        count: `4`
    };
    if (player.Name == dailyPlayer.Name) {
        let variables = {
            results: text,
            data: data,
            completed: `<h3 id="completed">Truzzle completed in 4/8 tries!</h3>`
        };
        let filter = {
            name: "total"
        };

        var newStat = {
            $inc: {
                scores: 4,
                entries: 1
            }
        };
        await client.connect();
        await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .updateOne(filter, newStat);
        await client.close();

        response.render("completed", variables);
    } else {
        response.render("guess4", variables);
    }
});

app.post("/guess5", async (request, response) => {

    let {
        playerGuess
    } = request.body;
   
    let player = data.find(element => element.Name == playerGuess);

    let {
        pname,
        position,
        height,
        age,
        number
    } = "#CDDEEE";

    if (player.PositionCategory == dailyPlayer.PositionCategory) {
        position = "rgba(255, 219, 88,.7)";

    }
    if (player.Position == dailyPlayer.Position) {

        position = "rgba(0,128,0,.7)";
    }
    let ph = player.Height.match(/\d+/g);
    let pheight = 12 * parseInt(ph.at(0)) + parseInt(ph.at(1));
    let dph = dailyPlayer.Height.match(/\d+/g);
    let dpheight = 12 * parseInt(dph.at(0)) + parseInt(dph.at(1));
    let htR = "";
    let ageR = "";
    let numbR = "";
     if (pheight < dpheight) {
         htR = `<br>&#8593;`;
    } else if (pheight > dpheight) {
         htR = `<br>&#8595;`;
    } 
    if (parseInt(player.Age) < parseInt(dailyPlayer.Age)) {
        ageR = `<br>&#8593;`;
    } else if (parseInt(player.Age) > parseInt(dailyPlayer.Age)) {
         ageR = `<br>&#8595;`;
    } 
    if (parseInt(player.Number) < parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8593;`;
    } else if (parseInt(player.Number) > parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8595;`;
    }

    if (pheight == dpheight) {
        height = "rgba(0,128,0,.7)";
    } else if ((pheight - dpheight) <= 2 && (pheight - dpheight) > 0) {
        height = "rgba(255, 219, 88,.7)";
        htR = `<br>&#8595;`;
    } else if ((pheight - dpheight) < 0 && (pheight - dpheight) >= -2) {
        htR = `<br>&#8593;`;
        height = "rgba(255, 219, 88,.7)";
    }
    if (parseInt(player.Age) == parseInt(dailyPlayer.Age)) {
        age = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) <= 2 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) > 0) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8595;`;
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) < 0 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) >= -2) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8593;`;
    }
    if (parseInt(player.Number) == parseInt(dailyPlayer.Number)) {
        number = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) <= 2 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) > 0) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8595;`;
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) < 0 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) >= -2) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8593;`;
    }
    if (player.Name == dailyPlayer.Name) {
        pname = "rgba(0,128,0,.7)";
    }
    css5 = `<style>#guess5Name {background-color: ${pname};}#guess5Pos {background-color: ${position};}#guess5Ht {background-color: ${height};   }#guess5Age {background-color: ${age};}#guess5Numb {background-color: ${number};}</style>`;
    res5 = getTiles(player, 5, ageR, htR, numbR);

    let text = css1 + css2 + css3 + css4 + css5 + resultFormat + res1 + '<hr>' + res2 + '<hr>' + res3 + '<hr>' + res4 + '<hr>' + res5;


    let variables = {
        results: text,
        data: data,
        count: `5`
    };
    if (player.Name == dailyPlayer.Name) {
        let variables = {
            results: text,
            data: data,
            completed: `<h3 id="completed">Truzzle completed in 5/8 tries!</h3>`
        };
        let filter = {
            name: "total"
        };

        var newStat = {
            $inc: {
                scores: 5,
                entries: 1
            }
        };
        await client.connect();
        await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .updateOne(filter, newStat);
        
        await client.close();

        response.render("completed", variables);
    } else {
        response.render("guess5", variables);
    }
});

app.post("/guess6", async (request, response) => {

    let {
        playerGuess
    } = request.body;
     
    let player = data.find(element => element.Name == playerGuess);

    let {
        pname,
        position,
        height,
        age,
        number
    } = "#CDDEEE";

    if (player.PositionCategory == dailyPlayer.PositionCategory) {
        position = "rgba(255, 219, 88,.7)";

    }
    if (player.Position == dailyPlayer.Position) {

        position = "rgba(0,128,0,.7)";
    }
    let ph = player.Height.match(/\d+/g);
    let pheight = 12 * parseInt(ph.at(0)) + parseInt(ph.at(1));
    let dph = dailyPlayer.Height.match(/\d+/g);
    let dpheight = 12 * parseInt(dph.at(0)) + parseInt(dph.at(1));
    let htR = "";
    let ageR = "";
    let numbR = "";
     if (pheight < dpheight) {
         htR = `<br>&#8593;`;
    } else if (pheight > dpheight) {
         htR = `<br>&#8595;`;
    } 
    if (parseInt(player.Age) < parseInt(dailyPlayer.Age)) {
        ageR = `<br>&#8593;`;
    } else if (parseInt(player.Age) > parseInt(dailyPlayer.Age)) {
         ageR = `<br>&#8595;`;
    } 
    if (parseInt(player.Number) < parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8593;`;
    } else if (parseInt(player.Number) > parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8595;`;
    }

    if (pheight == dpheight) {
        height = "rgba(0,128,0,.7)";
    } else if ((pheight - dpheight) <= 2 && (pheight - dpheight) > 0) {
        height = "rgba(255, 219, 88,.7)";
        htR = `<br>&#8595;`;
    } else if ((pheight - dpheight) < 0 && (pheight - dpheight) >= -2) {
        htR = `<br>&#8593;`;
        height = "rgba(255, 219, 88,.7)";
    }
    if (parseInt(player.Age) == parseInt(dailyPlayer.Age)) {
        age = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) <= 2 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) > 0) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8595;`;
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) < 0 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) >= -2) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8593;`;
    }
    if (parseInt(player.Number) == parseInt(dailyPlayer.Number)) {
        number = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) <= 2 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) > 0) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8595;`;
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) < 0 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) >= -2) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8593;`;
    }
    if (player.Name == dailyPlayer.Name) {
        pname = "rgba(0,128,0,.7)";
    }
    css6 = `<style>#guess6Name {background-color: ${pname};}#guess6Pos {background-color: ${position};}#guess6Ht {background-color: ${height};   }#guess6Age {background-color: ${age};}#guess6Numb {background-color: ${number};}</style>`;
    res6 = getTiles(player, 6, ageR, htR, numbR);

    let text = css1 + css2 + css3 + css4 + css5 + css6 + resultFormat + res1 + '<hr>' + res2 + '<hr>' + res3 + '<hr>' + res4 + '<hr>' + res5 + '<hr>' + res6;


    let variables = {
        results: text,
        data: data,
        count: `6`
    };
    if (player.Name == dailyPlayer.Name) {
        let variables = {
            results: text,
            data: data,
            completed: `<h3 id="completed">Truzzle completed in 6/8 tries!</h3>`
        };
        let filter = {
            name: "total"
        };

        var newStat = {
            $inc: {
                scores: 6,
                entries: 1
            }
        };
        await client.connect();
        await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .updateOne(filter, newStat);
        await client.close();

        response.render("completed", variables);
    } else {
        response.render("guess6", variables);
    }
});

app.post("/guess7", async (request, response) => {

    let {
        playerGuess
    } = request.body;
   
    let player = data.find(element => element.Name == playerGuess);

    let {
        pname,
        position,
        height,
        age,
        number
    } = "#CDDEEE";

    if (player.PositionCategory == dailyPlayer.PositionCategory) {
        position = "rgba(255, 219, 88,.7)";

    }
    if (player.Position == dailyPlayer.Position) {

        position = "rgba(0,128,0,.7)";
    }
    let ph = player.Height.match(/\d+/g);
    let pheight = 12 * parseInt(ph.at(0)) + parseInt(ph.at(1));
    let dph = dailyPlayer.Height.match(/\d+/g);
    let dpheight = 12 * parseInt(dph.at(0)) + parseInt(dph.at(1));

    let htR = "";
    let ageR = "";
    let numbR = "";
     if (pheight < dpheight) {
         htR = `<br>&#8593;`;
    } else if (pheight > dpheight) {
         htR = `<br>&#8595;`;
    } 
    if (parseInt(player.Age) < parseInt(dailyPlayer.Age)) {
        ageR = `<br>&#8593;`;
    } else if (parseInt(player.Age) > parseInt(dailyPlayer.Age)) {
         ageR = `<br>&#8595;`;
    } 
    if (parseInt(player.Number) < parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8593;`;
    } else if (parseInt(player.Number) > parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8595;`;
    }

    if (pheight == dpheight) {
        height = "rgba(0,128,0,.7)";
    } else if ((pheight - dpheight) <= 2 && (pheight - dpheight) > 0) {
        height = "rgba(255, 219, 88,.7)";
        htR = `<br>&#8595;`;
    } else if ((pheight - dpheight) < 0 && (pheight - dpheight) >= -2) {
        htR = `<br>&#8593;`;
        height = "rgba(255, 219, 88,.7)";
    }
    if (parseInt(player.Age) == parseInt(dailyPlayer.Age)) {
        age = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) <= 2 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) > 0) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8595;`;
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) < 0 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) >= -2) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8593;`;
    }
    if (parseInt(player.Number) == parseInt(dailyPlayer.Number)) {
        number = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) <= 2 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) > 0) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8595;`;
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) < 0 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) >= -2) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8593;`;
    }
    if (player.Name == dailyPlayer.Name) {
        pname = "rgba(0,128,0,.7)";
    }
    css7 = `<style>#guess7Name {background-color: ${pname};}#guess7Pos {background-color: ${position};}#guess7Ht {background-color: ${height};   }#guess7Age {background-color: ${age};}#guess7Numb {background-color: ${number};}</style>`;
    res7 = getTiles(player, 7, ageR, htR, numbR);

    let text = css1 + css2 + css3 + css4 + css5 + css6 + css7 + resultFormat + res1 + '<hr>' + res2 + '<hr>' + res3 + '<hr>' + res4 + '<hr>' + res5 + '<hr>' + res6 + '<hr>' + res7;


    let variables = {
        results: text,
        data: data,
        count: `7`
    };
    if (player.Name == dailyPlayer.Name) {
        let variables = {
            results: text,
            data: data,
            completed: `<h3 id="completed">Truzzle completed in 7/8 tries!</h3>`
        };
        let filter = {
            name: "total"
        };

        var newStat = {
            $inc: {
                scores: 7,
                entries: 1
            }
        };
        await client.connect();
        await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .updateOne(filter, newStat);
       
        await client.close();

        response.render("completed", variables);
    } else {
        response.render("guess7", variables);
    }
});

app.post("/completed", async (request, response) => {

    let {
        playerGuess
    } = request.body;

    let player = data.find(element => element.Name == playerGuess);

    let {
        pname,
        position,
        height,
        age,
        number
    } = "#CDDEEE";

    if (player.PositionCategory == dailyPlayer.PositionCategory) {
        position = "rgba(255, 219, 88,.7)";

    }
    if (player.Position == dailyPlayer.Position) {

        position = "rgba(0,128,0,.7)";
    }
    let ph = player.Height.match(/\d+/g);
    let pheight = 12 * parseInt(ph.at(0)) + parseInt(ph.at(1));
    let dph = dailyPlayer.Height.match(/\d+/g);
    let dpheight = 12 * parseInt(dph.at(0)) + parseInt(dph.at(1));

    let htR = "";
    let ageR = "";
    let numbR = "";
    if (pheight < dpheight) {
         htR = `<br>&#8593;`;
    } else if (pheight > dpheight) {
         htR = `<br>&#8595;`;
    } 
    if (parseInt(player.Age) < parseInt(dailyPlayer.Age)) {
        ageR = `<br>&#8593;`;
    } else if (parseInt(player.Age) > parseInt(dailyPlayer.Age)) {
         ageR = `<br>&#8593;`;
    } 
    if (parseInt(player.Number) < parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8593;`;
    } else if (parseInt(player.Number) > parseInt(dailyPlayer.Number)) {
       numbR = `<br>&#8595;`;
    }



    if (pheight == dpheight) {
        height = "rgba(0,128,0,.7)";
    } else if ((pheight - dpheight) <= 2 && (pheight - dpheight) > 0) {
        height = "rgba(255, 219, 88,.7)";
        htR = `<br>&#8595;`;
    } else if ((pheight - dpheight) < 0 && (pheight - dpheight) >= -2) {
        htR = `<br>&#8593;`;
        height = "rgba(255, 219, 88,.7)";
    }
    if (parseInt(player.Age) == parseInt(dailyPlayer.Age)) {
        age = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) <= 2 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) > 0) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8595;`;
    } else if ((parseInt(player.Age) - parseInt(dailyPlayer.Age)) < 0 && (parseInt(player.Age) - parseInt(dailyPlayer.Age)) >= -2) {
        age = "rgba(255, 219, 88,.7)";
        ageR = `<br>&#8593;`;
    }
    if (parseInt(player.Number) == parseInt(dailyPlayer.Number)) {
        number = "rgba(0,128,0,.7)";
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) <= 2 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) > 0) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8595;`;
    } else if ((parseInt(player.Number) - parseInt(dailyPlayer.Number)) < 0 && (parseInt(player.Number) - parseInt(dailyPlayer.Number)) >= -2) {
        number = "rgba(255, 219, 88,.7)";
        numbR = `<br>&#8593;`;
    }
    if (player.Name == dailyPlayer.Name) {
        pname = "rgba(0,128,0,.7)";
    }
    css8 = `<style>#guess8Name {background-color: ${pname};}#guess8Pos {background-color: ${position};}#guess8Ht {background-color: ${height};   }#guess8Age {background-color: ${age};}#guess8Numb {background-color: ${number};}</style>`;
    res8 = getTiles(player, 8, ageR, htR, numbR);

    let text = css1 + css2 + css3 + css4 + css5 + css6 + css7 + css8 + resultFormat + res1 + '<hr>' + res2 + '<hr>' + res3 + '<hr>' + res4 + '<hr>' + res5 + '<hr>' + res6 + '<hr>' + res7 + '<hr>' + res8;



    if (player.Name == dailyPlayer.Name) {
        let variables = {
            results: text,
            data: data,
            completed: `<h3 id="completed">Truzzle completed in 8/8 tries!</h3>`
        };
        let filter = {
            name: "total"
        };

        var newStat = {
            $inc: {
                scores: 8,
                entries: 1
            }
        };
        await client.connect();
        await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .updateOne(filter, newStat);
        
        await client.close();

        response.render("completed", variables);
    } else {
        
        let variables = {
            results: text,
            data: data,
            completed: `<h3 id="completed">Correct Player: ${dailyPlayer.Name}</h3>`
        };

        response.render("Ncompleted", variables);
    }
});






async function insert(application) {
    try {
        await client.connect();

        const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(application);
        return result;

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}


function getTiles(guessNumb, pos, ageR, htR, numbR) {
    let age = guessNumb.Age;
    if (age == null) {
        age = 'N/A'
    };
    let numb = guessNumb.Number;
    if (numb == null) {
        numb = 'N/A'
    };
    return `<div class="grid"><div class="pname" id="guess${pos}Name"> <h4 >${guessNumb.Name} </h4></div><div class="position" id="guess${pos}Pos"> <h4 >${guessNumb.Position} </h4></div><div class="height" id="guess${pos}Ht"> <h4 >${guessNumb.Height}${htR} </h4></div><div class="age" id="guess${pos}Age"> <h4 >${age}${ageR}</h4></div><div class="number" id="guess${pos}Numb"> <h4 >${numb}${numbR}</h4></div></div>`
}
const port = process.env.PORT || 5000;
http.createServer(app).listen(port);

/*
let portNumb = process.argv[2];
console.log(`Web server started and running at http://localhost:${portNumb}`);
http.createServer(app).listen(process.argv[2]);


let prompt = "Type stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
        let command = dataInput.trim();
        if (command === "stop") {
            console.log("Shutting down the server");
            process.exit(0);
        } else {
            console.log(`Invalid command: ${command}`);
        }
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});*/