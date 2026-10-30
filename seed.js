require("dotenv").config();
const {MongoClient}=require("mongodb");
async function main(){
 const uri=process.env.MONGODB_URI, dbName=process.env.DB_NAME||"StudentManagementDB";
 if(!uri)throw new Error("Set MONGODB_URI in .env");
 const client=new MongoClient(uri);
 try{
  await client.connect();const db=client.db(dbName);
  const students=[
   {student_id:101,name:"Rahul Sharma",age:20,department:"AI & Data Science",course:"MongoDB",marks:92},
   {student_id:102,name:"Priya Verma",age:21,department:"Computer Science",course:"Python",marks:90},
   {student_id:103,name:"Aman Singh",age:20,department:"AI & Data Science",course:"MongoDB",marks:82},
   {student_id:104,name:"Sneha Gupta",age:21,department:"Computer Science",course:"Python",marks:80},
   {student_id:105,name:"Vikas Kumar",age:22,department:"AI & Data Science",course:"Java",marks:88}
  ];
  for(const s of students)await db.collection("students").updateOne({student_id:s.student_id},{$set:{...s,updated_at:new Date()},$setOnInsert:{created_at:new Date()}},{upsert:true});
  const courses=[
   {course_id:201,course_name:"MongoDB",instructor:"Mr Sharma",duration:"3 Months"},
   {course_id:202,course_name:"Python",instructor:"Ms Verma",duration:"4 Months"},
   {course_id:203,course_name:"Java",instructor:"Mr Singh",duration:"3 Months"}
  ];
  for(const c of courses)await db.collection("courses").updateOne({course_id:c.course_id},{$set:c},{upsert:true});
  console.log("Seed complete: 5 students and 3 courses inserted/updated.");
 }finally{await client.close();}
}
main().catch(e=>{console.error(e.message);process.exit(1);});
