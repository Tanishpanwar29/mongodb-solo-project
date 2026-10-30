require("dotenv").config();
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(express.json());
const PORT = Number(process.env.PORT || 3000);
const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "StudentManagementDB";
if (!URI) { console.error("Set MONGODB_URI in .env"); process.exit(1); }

const client = new MongoClient(URI);
let students, courses;
const objectId = id => ObjectId.isValid(id) ? new ObjectId(id) : null;

app.get("/", (_req, res) => res.json({
  project: "Student Management and Performance Analysis System",
  status: "running",
  endpoints: ["/api/health", "/api/students", "/api/courses", "/api/analytics/course-summary"]
}));
app.get("/api/health", async (_req, res) => {
  try { await client.db(DB_NAME).command({ping:1}); res.json({status:"ok", database:DB_NAME}); }
  catch { res.status(503).json({status:"error", message:"Database ping failed"}); }
});

app.post("/api/students", async (req,res) => {
  const {student_id,name,age,department,course,marks}=req.body;
  if(student_id==null || !name || age==null || !department || !course || marks==null)
    return res.status(400).json({error:"Required: student_id, name, age, department, course, marks"});
  const doc={student_id:Number(student_id),name:String(name).trim(),age:Number(age),
    department:String(department).trim(),course:String(course).trim(),marks:Number(marks),
    created_at:new Date(),updated_at:new Date()};
  if(!Number.isFinite(doc.age)||!Number.isFinite(doc.marks)||!Number.isFinite(doc.student_id))
    return res.status(400).json({error:"student_id, age and marks must be numbers"});
  try { const r=await students.insertOne(doc); res.status(201).json({_id:r.insertedId,...doc}); }
  catch(e){ if(e.code===11000)return res.status(409).json({error:"student_id already exists"}); res.status(500).json({error:"Could not create student"}); }
});
app.get("/api/students", async (req,res) => {
  const filter={};
  if(req.query.course) filter.course=String(req.query.course);
  if(req.query.minMarks!==undefined){const n=Number(req.query.minMarks);if(!Number.isFinite(n))return res.status(400).json({error:"minMarks must be numeric"});filter.marks={$gte:n};}
  try{res.json(await students.find(filter).sort({student_id:1}).toArray());}
  catch{res.status(500).json({error:"Could not retrieve students"});}
});
app.get("/api/students/:id", async(req,res)=>{
  const id=objectId(req.params.id);if(!id)return res.status(400).json({error:"Invalid MongoDB document ID"});
  try{const doc=await students.findOne({_id:id});if(!doc)return res.status(404).json({error:"Student not found"});res.json(doc);}
  catch{res.status(500).json({error:"Could not retrieve student"});}
});
app.patch("/api/students/:id", async(req,res)=>{
  const id=objectId(req.params.id);if(!id)return res.status(400).json({error:"Invalid MongoDB document ID"});
  const fields=["student_id","name","age","department","course","marks"], update={};
  for(const k of fields)if(req.body[k]!==undefined)update[k]=req.body[k];
  if(!Object.keys(update).length)return res.status(400).json({error:"Provide fields to update"});
  for(const k of ["student_id","age","marks"])if(update[k]!==undefined)update[k]=Number(update[k]);
  update.updated_at=new Date();
  try{const r=await students.updateOne({_id:id},{$set:update});if(!r.matchedCount)return res.status(404).json({error:"Student not found"});res.json({message:"Student updated",modified:r.modifiedCount});}
  catch(e){if(e.code===11000)return res.status(409).json({error:"student_id already exists"});res.status(500).json({error:"Could not update student"});}
});
app.delete("/api/students/:id", async(req,res)=>{
  const id=objectId(req.params.id);if(!id)return res.status(400).json({error:"Invalid MongoDB document ID"});
  try{const r=await students.deleteOne({_id:id});if(!r.deletedCount)return res.status(404).json({error:"Student not found"});res.json({message:"Student deleted"});}
  catch{res.status(500).json({error:"Could not delete student"});}
});

app.post("/api/courses", async(req,res)=>{
  const {course_id,course_name,instructor,duration}=req.body;
  if(course_id==null||!course_name||!instructor||!duration)return res.status(400).json({error:"Required: course_id, course_name, instructor, duration"});
  const doc={course_id:Number(course_id),course_name:String(course_name).trim(),instructor:String(instructor).trim(),duration:String(duration).trim()};
  try{const r=await courses.insertOne(doc);res.status(201).json({_id:r.insertedId,...doc});}
  catch(e){if(e.code===11000)return res.status(409).json({error:"course_id already exists"});res.status(500).json({error:"Could not create course"});}
});
app.get("/api/courses",async(_req,res)=>{try{res.json(await courses.find({}).sort({course_id:1}).toArray());}catch{res.status(500).json({error:"Could not retrieve courses"});}});
app.patch("/api/courses/:id",async(req,res)=>{
  const id=objectId(req.params.id);if(!id)return res.status(400).json({error:"Invalid MongoDB document ID"});
  const update={};for(const k of ["course_id","course_name","instructor","duration"])if(req.body[k]!==undefined)update[k]=req.body[k];
  if(!Object.keys(update).length)return res.status(400).json({error:"Provide fields to update"});
  if(update.course_id!==undefined)update.course_id=Number(update.course_id);
  try{const r=await courses.updateOne({_id:id},{$set:update});if(!r.matchedCount)return res.status(404).json({error:"Course not found"});res.json({message:"Course updated",modified:r.modifiedCount});}
  catch(e){if(e.code===11000)return res.status(409).json({error:"course_id already exists"});res.status(500).json({error:"Could not update course"});}
});
app.delete("/api/courses/:id",async(req,res)=>{
  const id=objectId(req.params.id);if(!id)return res.status(400).json({error:"Invalid MongoDB document ID"});
  try{const r=await courses.deleteOne({_id:id});if(!r.deletedCount)return res.status(404).json({error:"Course not found"});res.json({message:"Course deleted"});}
  catch{res.status(500).json({error:"Could not delete course"});}
});
app.get("/api/analytics/course-summary",async(_req,res)=>{
  try{res.json(await students.aggregate([
    {$group:{_id:"$course",total_students:{$sum:1},average_marks:{$avg:"$marks"},highest_marks:{$max:"$marks"}}},
    {$project:{_id:0,course:"$_id",total_students:1,average_marks:{$round:["$average_marks",2]},highest_marks:1}},
    {$sort:{course:1}}
  ]).toArray());}catch{res.status(500).json({error:"Aggregation failed"});}
});

async function start(){
  try{
    await client.connect();
    const db=client.db(DB_NAME);students=db.collection("students");courses=db.collection("courses");
    await students.createIndex({student_id:1},{unique:true});
    await students.createIndex({course:1,marks:-1});
    await courses.createIndex({course_id:1},{unique:true});
    await courses.createIndex({course_name:1});
    app.listen(PORT,()=>console.log(`API running at http://localhost:${PORT} | DB: ${DB_NAME}`));
  }catch(e){console.error("Startup failed. Check URI, Atlas IP access, credentials, and cluster status.");console.error(e.message);process.exit(1);}
}
async function shutdown(){await client.close();process.exit(0);}
process.on("SIGINT",shutdown);process.on("SIGTERM",shutdown);
start();
