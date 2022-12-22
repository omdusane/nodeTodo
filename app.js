const express = require('express');
const bodyParser = require('body-parser');
const _ = require("lodash");
const mongoose = require('mongoose');

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("public"));
mongoose.set('strictQuery', false);
//store URI in .env then load it using dotenv
mongoose.connect("mongodb+srv://Om:Om280103@cluster0.pj9cmmi.mongodb.net/todolistDB");

const itemSchema = {
    name: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
    name : "Welcome to your todolist!"
});

const item2 = new Item({
    name : "Hit the + button to add a new item."
});

const item3 = new Item({
    name : "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


const listSchema = {
    name: String,
    items: [itemSchema]

};

const List = mongoose.model("List", listSchema);


app.get("/", function(req,res){
    
    Item.find({}, function(err, foundItems){

        if(foundItems.length === 0){
            Item.insertMany(defaultItems, function(err){
                if (err){
                    console.log(err);
                } else {
                    console.log("Succesfully saved default items to DB.")
                }
            });
            res.redirect("/");
        } 
        else {
            res.render("list",{listTitle:"Today", items:foundItems});
        }

    });
    
});

app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if (!foundList){
                //Create New List
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
            
                list.save();
                // setTimeout(function(){
                // }, 5000)
                res.redirect("/" + customListName);
            }
            else{
                //Show an Existing List
                res.render("list", {listTitle:foundList.name, items:foundList.items});
            }
        }
    })

    
})

app.post("/", function(req,res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name:listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect(`/${listName}`);
        })
    }

});

app.post("/delete", function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(!err){
                console.log("Successfully deleted checked item");
                res.redirect("/")
            }
            else{
                console.log(err);
            }
        });
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err,foundlist){
            if(!err){
                res.redirect(`/${listName}`);
            }
        })
    }

    
})



app.get("/work", function(req,res){
    res.render("list", {listTitle: "Work List", items:workItems})
});

app.post("/work", function(req,res){
    let item = req.body.newItem;
    res.redirect("/work");
});


app.listen(3000, function(){
    console.log("Surver is running on port 3000")
});
