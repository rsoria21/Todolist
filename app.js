//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// This is the connection and the data base(paste this for local viewing without server mongodb://localhost:27017)
mongoose.connect(
  "mongodb+srv://admin-ricardo:Chicken77@cluster0.a2xsm.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// this is a mongoose schema called itemsSchema, which is a "name" with data type of "string"
const itemsSchema = {
  name: String,
};

// mongoose model  based on schema above, with singular form not Items-Item
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todo list!",
});

const item2 = new Item({
  name: "Hit that + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Press this to delete an item",
});
// this is the list that is shown on the home page
const defultItems = [item1, item2, item3];
// this is used for the new array(list check box) that will be made on each dynamic page
const listSchema = {
  name: String,
  items: [itemsSchema],
};

// mongoose model  based on schema above, with singular form not Lists-List
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successully saved defult items to data base");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});
// express route parameters, meaning it creates dinamic pages on the fly
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // creates new list
        const list = new List({
          name: customListName,
          items: defultItems,
        });
        list.save();
        // this renders the page in real time using the input the client used in the /blahblahblah
        res.redirect("/" + customListName);
      } else {
        // shows exsisting list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });
  // this is used to push the new item into the current list that youre on, speaking with list.ejs file.
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      // this saves the item to the database (mongo)
      foundList.save();
      // this saves the item to the list on webpage
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        // this is what removes the checked item from the interface(list)
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});
// this is used for heroku to access the app
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server has started successfully");
});
