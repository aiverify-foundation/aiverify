let db = connect("mongodb://aiverify:aiverify@localhost:27017/admin");

db = db.getSiblingDB("aiverify");
db.createCollection("test-collection");

db.createUser({
  user: "aiverify",
  pwd: "aiverify",
  roles: [{ role: "readWrite", db: "aiverify" }],
});
