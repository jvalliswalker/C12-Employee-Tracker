const {Pool} = require('pg');

const database_info = {};

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  database: 'employee_tracker'
  },
  console.log('Connected to database employee_tracker')
)

// pool.connect(); //<-- What does this do?
 
pool.query('SELECT id, name FROM departments', [])
  .then(results => {
    const {rows} = results;

    const departments_map = {}

    for(const row of rows){
      departments_map[row.name] = row.id;
    }

    database_info['departments'] = {
      'rows' : rows,
      'map': departments_map
    };

    console.log(database_info.departments.rows);
  })
