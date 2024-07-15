## Quick Start

```
npm i
node dl.mjs dQw4w9WgXcQ
```

## Usage

### CLI

```
node dl.mjs <YOUTUBE_ID> [OUTFILE] [SIZE]
```

- `YOUTUBE_ID` - required - Your youtube-id, like `dQw4w9WgXcQ`
- `OUTFILE` - optional - the filename you want to output
- `SIZE` - optional - one of these - `hd1080|hd720|large|medium|small|tiny`


### Code

```js
import getYoutubeInfo from '@konsumer/ytdownload'

const info = await getYoutubeInfo('dQw4w9WgXcQ')

```

Youtube seperates the audio/video streams, so you will need to figure out how to merge them. See [my CLI](dl.mjs) for an example.