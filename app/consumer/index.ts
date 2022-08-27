import amqplib, { Channel, Connection } from 'amqplib'
import express, { Request, Response } from 'express'

const app = express()

app.use(express.json())

const PORT = 5500

let channel: Channel, connection: Connection

connect()

async function connect() {
  try {
    const amqpServer = 'amqp://localhost:5672'
    connection = await amqplib.connect(amqpServer)
    channel = await connection.createChannel()
    await channel.consume('events', (data) => {
      if (data?.content) {
        internalStore.push(JSON.parse(data.content.toString()))
      }
      channel.ack(data!);
    })
  } catch (error) {
    console.log(error)
  }
}

const internalStore: any = []

type ApiResponse = {
  data?: {
    incidents: Array<Incident>
    officers: Array<Officer>
  }
  error?: {
    code: string
    message: string
  }
}
type Incident = {
  id: number
  codeName: string
  loc: {
    x: number
    y: number
  }
  officerId: number | null
}

type Officer = {
  id: number
  badgeName: string
  loc: {
    x: number
    y: number
  } | null
}


app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})


function getDistance(x1, y1, x2, y2){
  if (!x1 || !y1 || !x2 || !y2) {
    return 9999999999999999;
  }
  let y = x2 - x1;
  let x = y2 - y1;
  
  return Math.sqrt(x * x + y * y);
}


const getStates = (request: Request, response: Response) => {
  
  
  let incidents: Array<Incident> = []
  let officers: Array<Officer> = []
  // Getting init incidents and officers
  internalStore.map(msg => {
    if (msg?.type === 'IncidentOccurred') {
      incidents.push({
        id: msg?.incidentId, 
        codeName: msg?.codeName, 
        loc: { 
          x: msg?.loc.x, 
          y: msg?.loc.y, 
        },
      officerId: null,
      })
    } else if (msg?.type === 'IncidentResolved') {
      incidents = incidents.filter(item => item.id != msg?.incidentId);
    } else if (msg?.type === 'OfficerGoesOnline') {
      officers.push({
        id: msg.officerId, 
        badgeName: msg.badgeName, 
        loc: null
      })
    } else if (msg?.type === 'OfficerLocationUpdated') {
      const officer = officers.find(officer => officer.id === msg.officerId)
      officer!.loc = { 
        x: msg.loc.x,
        y: msg.loc.y
      }
    } else if (msg?.type === 'OfficerGoesOffline') {
      officers = officers.filter(item => item.id != msg?.officerId);
    }
  }) 
 
  let busyOfficers = {}
  incidents.map(incident => {
    let minDistance = -1
    officers.map(office => {
      const realDistance = getDistance(incident.loc?.x, incident.loc?.y, office.loc?.x, office.loc?.y);
      if ( minDistance < realDistance && !busyOfficers[office.id]) {
        minDistance = realDistance;
        incident.officerId = office.id
        busyOfficers[office.id] = true
      } 
    })
  })

  let states: ApiResponse = {
    data: {
      incidents: incidents, 
      officers: officers,
    },
  };
  response.status(200).json(states);
};

app.get('/api/v1/state', getStates);