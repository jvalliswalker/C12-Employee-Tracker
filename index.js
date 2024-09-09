const { connectToDatabase } = require('./assets/scripts/db-connector');
const pool = connectToDatabase();

const database_info = {};
 
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
