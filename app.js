const express = require('express')

const path = require('path')

const {open} = require('sqlite')

const sqlite3 = require('sqlite3')

const app = express()

app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server is running on http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
  }
}

initializeDBAndServer()

convertPlayerDetailsToResObj = dbObj => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  }
}

// API to get list of players

app.get('/players', async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details
    `

  try {
    const playersArray = await db.all(getPlayersQuery)
    const resObjArray = playersArray.map(dbObj =>
      convertPlayerDetailsToResObj(dbObj),
    )

    response.send(resObjArray)
  } catch (e) {
    console.log(`Getting list of players Error : ${e.message}`)
  }
})

// API to get specific player details

app.get('/players/:playerId', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `

  SELECT *  
  FROM player_details
  WHERE player_id = ${playerId}
  `

  try {
    const player = await db.get(getPlayerQuery)
    const resObj = convertPlayerDetailsToResObj(player)
    response.send(resObj)
  } catch (e) {
    console.log(`Getting spcecific player Error : ${e.message}`)
  }
})

// API to update details of specific played by ID

app.put('/players/:playerId', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerQuery = `

  UPDATE player_details
  SET
  player_name = '${playerName}'
  WHERE player_id = ${playerId}

  `

  try {
    await db.run(updatePlayerQuery)
    response.send('Player Details Updated')
  } catch (e) {
    console.log(`Updating Players Details Error : ${e.message}`)
  }
})

convertMatchDetailsToResObj = dbObj => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  }
}

// API to get list of all matches  -- extra

app.get('/matches', async (request, response) => {
  const getMatcheQuery = `

  SELECT *
  FROM match_details
  `

  try {
    const matchesArray = await db.all(getMatcheQuery)

    const resArray = matchesArray.map(dbObj =>
      convertMatchDetailsToResObj(dbObj),
    )

    response.send(resArray)
  } catch (e) {
    console.log(`List of matches Error : ${e.message}`)
  }
})

// API to get specific match details

app.get('/matches/:matchId', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `

  SELECT *
  FROM match_details
  WHERE match_id = ${matchId}
  `

  try {
    const match = await db.get(getMatchQuery)
    const resObj = convertMatchDetailsToResObj(match)
    response.send(resObj)
  } catch (e) {
    console.log(`Match details Error : ${e.message}`)
  }
})

// API to get list of matches of a player
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params

  const getAllMatchesOfPlayer = `
  SELECT match_id, match, year
  FROM match_details 
  NATURAL JOIN player_match_score 
  WHERE player_id = ${playerId} 
  `
  try {
    const matchesOfPlayerArr = await db.all(getAllMatchesOfPlayer)
    const resObj = matchesOfPlayerArr.map(dbObj =>
      convertMatchDetailsToResObj(dbObj),
    )
    response.send(resObj)
  } catch (e) {
    console.log(`List of matches of a player Error : ${e.message}`)
  }
})

// API to return list of players of specific match
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params

  const getPlayersOfAMatch = `
  SELECT player_id, player_name
  FROM player_details
  NATURAL JOIN player_match_score
  WHERE match_id = ${matchId}
  `
  const playerOfAMatch = await db.all(getPlayersOfAMatch)
  const resObj = playerOfAMatch.map(dbObj =>
    convertPlayerDetailsToResObj(dbObj),
  )
  response.send(resObj)
})

// API to get total score, sixes and fours of a specific player by ID
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params

  const getTotalScoreSixesFouresQuery = `
  SELECT player_id AS playerId, player_name AS playerName, sum(score) AS totalScore , sum(fours) AS totalFours, sum(sixes) AS totalSixes
  FROM player_details
  NATURAL JOIN player_match_score 
  WHERE player_id = ${playerId}
  `
  const dbArray = await db.get(getTotalScoreSixesFouresQuery)
  response.send(dbArray)
})

module.exports = app
