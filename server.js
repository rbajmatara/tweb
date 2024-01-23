const express = require('express');
const associateModels = require('./models/associate');
const {DataTypes} = require('sequelize');
const cors = require('cors');
const PORT = process.env.PORT || 3001;

const bodyParser = require('body-parser')
const Sequelize = require('sequelize');


const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'sample.db',
    define: {
      timestamps: false
    }
  })

const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    user_type: {
      type: DataTypes.ENUM('organizer', 'author', 'reviewer'),
      allowNull: false,
    },
  });

  const Conference = sequelize.define('Conference', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    organizer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  });

  const Article = sequelize.define('Article', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    conference_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
  });

const app = express()
app.use(bodyParser.json())
app.use(cors());

associateModels(sequelize);
  

const authenticateDatabase = async()=>{
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
      } catch (error) {
        console.error('Unable to connect to the database:', error);
      }
}
authenticateDatabase();


app.post('/articles', async (req, res) => {
    try {
        const article = Article.build(req.body);
        article.save();
      res.status(201).json({ message: 'created' })
    } catch (e) {
      console.warn(e)
      res.status(500).json({ message: 'server error' })
    }
  })
  app.get('/article/:id', async (req, res, next) => {
    const articleId = req.params.id;
    try {
      const article = await Article.findByPk(articleId);
      return res.status(200).json(article);
    } catch (error) {
      console.error('Error fetching articles:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  })

app.get('/conference/:conference_id/articles', async (req, res, next) => {
    const conferenceId = req.params.conference_id;
    try {
      const articles = await Article.findAll({
        where: { conference_id: conferenceId },
      });
  
      return res.status(200).json(articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  })

app.post('/conferences', async (req, res) => {
    try {
        const conference = Conference.build(req.body);
        conference.save();
      res.status(201).json({ message: 'created' })
    } catch (e) {
      console.warn(e)
      res.status(500).json({ message: 'server error' })
    }
  })
  app.get('/conferences', async (req, res, next) => {
    try {
      const [conferences, meta] = await sequelize.query('select * from Conferences')
      res.status(200).json(conferences)
    } catch (e) {
      next(e)
    }
  })
  app.delete('/conferences/:id', async (req, res, next) => {
    try {
        const conferenceID = req.params.id;
        const conference = await Conference.findByPk(conferenceID);
        if (!conference) {
            return res.status(404).json({ message: 'Conference not found' });
          }
          // Perform the deletion
          await conference.destroy();
      return res.status(204).json({ message: 'Deleted' })
    } catch (e) {
      next(e)
    }
  })

app.post('/users', async (req, res) => {
    try {
        const user = User.build(req.body);
        user.save();
      res.status(201).json({ message: 'created' })
    } catch (e) {
      console.warn(e)
      res.status(500).json({ message: 'server error' })
    }
  })

  app.get('/users', async (req, res, next) => {
    try {
      const [users, meta] = await sequelize.query('select * from Users')
      res.status(200).json(users)
    } catch (e) {
      next(e)
    }
  })
  app.get('/user/:email', async (req, res, next) => {
    try {
      const userEmail = req.params.email;
      const user = await User.findOne({
        where: { email: userEmail },
      });
      res.status(200).json(user)
    } catch (e) {
      next(e)
    }
  })
  app.get('/user/id/:id', async (req, res, next) => {
    try {
      const userId = req.params.id;
      const user = await User.findByPk(userId);
      res.status(200).json(user)
    } catch (e) {
      next(e)
    }
  })

sequelize.sync()
.then(() => console.log('created'))
.catch((error) => console.log(error))

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });