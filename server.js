import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración YouTube
const API_KEY = process.env.YT_API_KEY; // pon tu API key en .env en Render
const CHANNEL_ID = "UCB42d0v7Pnt6-CZV1zdNnHQ"; // ID real de @hugo_slayero; cámbialo si hiciera falta
const MAX_RESULTS = 20;

// Helper: obtener ID de la playlist de subidas del canal
async function getUploadsPlaylistId() {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error("Error canales: " + resp.status);
  }
  const data = await resp.json();
  const items = data.items || [];
  if (!items.length) throw new Error("Canal no encontrado");
  return items[0].contentDetails.relatedPlaylists.uploads;
}

// Helper: obtener vídeos de la playlist de subidas
async function getChannelVideos() {
  const uploadsPlaylistId = await getUploadsPlaylistId();

  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${MAX_RESULTS}&key=${API_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error("Error playlist: " + resp.status);
  }
  const data = await resp.json();
  const items = data.items || [];

  // Mapeo al formato que usa tu front
  const videos = items.map(item => {
    const snippet = item.snippet;
    const videoId = snippet.resourceId.videoId;
    return {
      titulo: snippet.title,
      juego: "Otros",        // aquí puedes luego clasificar por título si quieres
      duracion: "N/A",       // se podría rellenar haciendo otra llamada a videos.list
      fecha: snippet.publishedAt,
      videoId: videoId
    };
  });

  return videos;
}

// Endpoint principal para tu app
app.get("/api/hugo_slayero", async (req, res) => {
  try {
    const videos = await getChannelVideos();

    // Aquí podrías generar "directos" a mano si quieres
    const directos = [
      {
        titulo: "Directo del canal",
        juego: "Varios",
        fecha: "Próximamente",
        estado: "Programado"
      }
    ];

    res.setHeader("Access-Control-Allow-Origin", "*"); // permitir llamadas desde tu APK/HTML
    res.json({ videos, directos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo vídeos" });
  }
});

app.get("/", (req, res) => {
  res.send("API CobaltGaming funcionando");
});

app.listen(PORT, () => {
  console.log("Servidor escuchando en puerto", PORT);
});
