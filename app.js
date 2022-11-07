const express=require('express');
const bodyParser= require('body-parser');
const mongoose = require("mongoose");
const _=require("lodash");
const dotenv = require("dotenv")
const app=express();

dotenv.config()
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

const DATABASE_URL=process.env.DATABASE_URL;
const CONFIG={
    //newUrlParser:false,
    useUnifiedTopology:true,
    // useCreateIndex: false
}
mongoose.connect(DATABASE_URL,CONFIG);

const itemsSchema={
    name:String
}

const Item=mongoose.model("Item",itemsSchema)

const defaultItems=[]

const listSchema={
    name:String,
    items:[itemsSchema]
};

const List=mongoose.model("List",listSchema);

const today=new Date();
    const options={
        weekday: "long",
        day:"numeric",
        month:"long"
    }
const day =today.toLocaleDateString("en-US",options);

app.get("/list", function(req,res){
    Item.find({},function(err,foundItems){
            console.log(foundItems.name)
            res.render("list",{listTitle: day, NewListItems: foundItems});
    }) 
});

app.get("/:customListName",function(req,res){
    const customListName=_.capitalize(req.params.customListName);
    List.findOne({name:customListName},function(err,foundList){
        if(!err){
            if(!foundList){
                const list=new List({
                    name:customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            }
            else{
                
                res.render("list",{listTitle: foundList.name, NewListItems: foundList.items})
            }
        }
    });
    
});

app.post("/list", function(req,res){
    const itemName=req.body.newitem;
    const listName=req.body.list;
    const item=new Item({
        name:itemName
    });
    if(listName=== day){
        item.save();
        res.redirect("/list");
    }else{
        List.findOne({name: listName},function(err,foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName)
        })
    }
    
})

const PORT = process.env.PORT;

app.listen(PORT,function(){
    console.log(`Server on port ${PORT} successfully...`)
})

app.post("/deletelist",function(req,res){
    const checkedItemId=req.body.checkBox;
    const listName=req.body.listName;

    if(listName===day){
        Item.findByIdAndRemove(checkedItemId,function(err){
            if(!err){
                console.log("Successfully deleted checked item!");
                res.redirect("/list");
            }
        })
    }else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList){
            if(!err){
                res.redirect("/"+listName);
            }
        });
    }
});