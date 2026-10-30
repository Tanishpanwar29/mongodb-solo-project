# Student Management and Performance Analysis System

College final project: REST API using Node.js, Express, and MongoDB.

## Features
- CRUD operations for students and courses
- Indexes for unique IDs and common queries
- Aggregation analytics: count, average marks, highest marks by course
- Health check endpoint
- Backup/restore and replication documentation

## Requirements
- Node.js 18+
- MongoDB Atlas or local MongoDB
- MongoDB Database Tools for `mongodump`/`mongorestore`
- Postman or Thunder Client (optional)

## Run in VS Code on Windows
1. Extract the ZIP and open the project folder in VS Code.
2. In Terminal → New Terminal, run:
   ```powershell
   npm install
   Copy-Item .env.example .env
   ```
3. Open `.env`. For local MongoDB, use `mongodb://127.0.0.1:27017`.
   For Atlas, replace it with your own connection string from Atlas. Do not share `.env` or your password.
4. Seed the database:
   ```powershell
   node seed.js
   ```
5. Start the API:
   ```powershell
   npm start
   ```
6. Open `http://localhost:3000`; health check: `http://localhost:3000/api/health`.

If PowerShell blocks npm scripts, use `npm.cmd install` and `npm.cmd start`.

## API endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API overview |
| GET | `/api/health` | MongoDB connection check |
| POST | `/api/students` | Create student |
| GET | `/api/students` | List students |
| GET | `/api/students?course=MongoDB` | Filter by course |
| GET | `/api/students?minMarks=80` | Filter by minimum marks |
| GET | `/api/students/:id` | Read by MongoDB `_id` |
| PATCH | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |
| POST | `/api/courses` | Create course |
| GET | `/api/courses` | List courses |
| PATCH | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |
| GET | `/api/analytics/course-summary` | Aggregation analytics |

For PATCH/DELETE, `:id` means the MongoDB `_id` returned by the API, not `student_id` or `course_id`.

## Sample request bodies

POST `/api/students`:
```json
{"student_id":106,"name":"Rohit Meena","age":21,"department":"AI & Data Science","course":"MongoDB","marks":89}
```
PATCH `/api/students/<MongoDB _id>`:
```json
{"marks":95}
```
POST `/api/courses`:
```json
{"course_id":204,"course_name":"Data Analytics","instructor":"Ms Sharma","duration":"3 Months"}
```

## Indexes
The server creates:
- Unique index on `students.student_id`
- Compound index on `students.course` and `students.marks`
- Unique index on `courses.course_id`
- Index on `courses.course_name`

Inspect in mongosh:
```javascript
use StudentManagementDB
db.students.getIndexes()
db.courses.getIndexes()
db.students.find({course:"MongoDB",marks:{$gte:80}}).explain("executionStats")
```
Indexes can speed up matching reads but use storage and add work to writes.

## Backup and recovery

For a local MongoDB server with Database Tools installed:
```powershell
mongodump --uri="mongodb://127.0.0.1:27017" --db=StudentManagementDB --out=".\mongodb_backup"
```
Restore to a separate test database first:
```powershell
mongorestore --uri="mongodb://127.0.0.1:27017" --db=StudentManagementDB_Restore ".\mongodb_backup\StudentManagementDB"
```
For Atlas, use backup features supported by your cluster tier or use Database Tools with an authorized connection string. Keep backups secure and verify restore before claiming success.

## Replication
- Atlas topology and replica-set options depend on the cluster tier/configuration. Inspect Atlas deployment details and monitoring to document actual replica status.
- A local replica set must be configured on the MongoDB server (for example, `replication.replSetName` in the config) before initiating it in `mongosh`.
- Do not run `rs.initiate()` on a shared Atlas deployment.
- Replication is not a replacement for backups; accidental deletion can replicate to other members.
- Add screenshots of your real deployment topology and backup/restore test to your project report.

## Testing checklist
- [ ] Health endpoint returns `status: ok`
- [ ] Seed data is available
- [ ] Student create/read/update/delete tested
- [ ] Course create/read/update/delete tested
- [ ] Filters and aggregation tested
- [ ] Indexes verified
- [ ] Backup created and restore tested on a separate database
- [ ] Replication status/topology documented
- [ ] API works after restart

## Atlas troubleshooting
If Atlas connection fails: verify cluster is running, current public IP is allowed in Atlas Network Access, URI and database-user credentials are correct, and network/firewall allows access. Use the connection string from Atlas's Connect flow.
