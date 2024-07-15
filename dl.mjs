import { writeFile, readFile } from 'fs/promises'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffmpeg from 'fluent-ffmpeg'
import cliProgress from 'cli-progress'
import { getInfo } from './yt.mjs'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

if (process.argv.length < 3) {
  console.error('Usage: dl <YOUTUBE_ID> [OUTFILE] [size]')
  process.exit(1)
}

// save merged files
// a bit annoying to use temp-files
// feel free to work out some other way
const mergeAudioVideo = (outfile, ...files) => new Promise((resolve, reject) => {
  const cmd = ffmpeg()
    .addOptions(['-c copy'])
    .format('mp4')
    .on('error', reject)
    .on('end', resolve)

  for (const f of files) {
    cmd.addInput(f)
  }
  cmd.save(outfile)
}) 

async function downloadVideo(id, outfile, videoSize='large', audioSize='tiny') {
  const info = await getInfo(id)
  const video = info.streamingData.adaptiveFormats.find(f => f.mimeType.includes('video/mp4') && f.quality === videoSize)
  const audio = info.streamingData.adaptiveFormats.find(f => f.mimeType.includes('audio/mp4') && f.quality === audioSize)
  if (!video || !audio) {
    throw new Error(`Media link not found for ${id}:${size}`)
  }

  if (typeof outfile === 'undefined') {
    outfile = `${info.videoDetails.title}-${videoSize}-${audioSize}.mp4`
  }

  console.log(`Downloading ${info.videoDetails.title} to "${outfile}"`)
  
  const multibar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: ' {bar} | {part} | {value}/{total} | {eta}s'
  }, cliProgress.Presets.shades_grey)

  const req1 = await fetch(video.url)
  const req2 = await fetch(audio.url)
  const r1 = req1.body.getReader()
  const r2 = req2.body.getReader()
  const r1Total = req1.headers.get('content-length')
  const r2Total = req2.headers.get('content-length')
  const b1 = multibar.create(r1Total, 0)
  const b2 = multibar.create(r2Total, 0)

  const videoChunks = []
  const audioChunks = []

  while(true) {
    const v = await r1.read()
    const a = await r2.read()

    if (v.done && a.done) {
      break;
    }

    if (!v.done) {
      videoChunks.push(...v.value)
    }
    if (!a.done) {
      audioChunks.push(...a.value)
    }

    b1.update(videoChunks.length, {part: 'video'})
    b2.update(audioChunks.length, {part: 'audio'})
  }

  multibar.stop()
  await writeFile('/tmp/vid.mp4', new Uint8Array(videoChunks))
  await writeFile('/tmp/aud.mp4', new Uint8Array(audioChunks))
  console.log('Merging audio & video.')
  await mergeAudioVideo(outfile, '/tmp/vid.mp4', '/tmp/aud.mp4')
}

await downloadVideo(process.argv[2],  process.argv[3], process.argv[4], 'tiny')
