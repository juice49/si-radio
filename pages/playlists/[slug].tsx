import { NextPage, GetStaticProps, GetStaticPaths } from 'next'
import Image from 'next/image'
import groq from 'groq'
import { styled } from '../../stitches.config'
import sanity from '../../lib/sanity'
import getAppleMusicImageUrl from '../../lib/get-apple-music-image-url'
import Stack from '../../components/stack'

interface MosaicEntry {
  albumName: string
  color: string
  imageUrl: string
}

interface Track {
  _type: 'track'
  name: string
  artists: {
    name: string
  }[]
  album: {
    name: string
    color: string
    appleMusicImageUrl: string
  }
}

interface Comment {
  _type: 'comment'
  comment: string
  curator: {
    person: {
      firstName: string
      lastName: string
    }
  }
}

interface Props {
  playlist: {
    _id: string
    name: string
    trackCount: number
    commentCount: number
    curators: {
      person: {
        firstName: string
        lastName: string
      }
    }[]
    mosaic: MosaicEntry[]
    tracks: (Track | Comment)[]
  }
}

const Main = styled('main', {
  maxWidth: '80ch',
  marginLeft: 'auto',
  marginRight: 'auto',
})

const CommentContainer = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$1',
  padding: '$1',
  backgroundColor: '#000',
  color: '#fff',
})

const Track: React.FC<Track> = ({ name, artists, album }) => (
  <Stack
    as='article'
    direction='inline'
    css={{
      alignItems: 'center',
    }}
  >
    <Image
      alt={`The album art for "${album.name}" by ${artists
        .map(({ name }) => name)
        .join(', ')}`}
      src={getAppleMusicImageUrl(album.appleMusicImageUrl, 160)}
      width={80}
      height={80}
    />
    <div>
      <h2>{name}</h2>
      <p>{artists.map(artist => artist.name).join(', ')}</p>
    </div>
  </Stack>
)

const Comment: React.FC<Comment> = ({ comment, curator }) => (
  <CommentContainer as='figure'>
    <blockquote>{comment}</blockquote>
    <figcaption>
      {[curator.person.firstName, curator.person.lastName].join(' ')}
    </figcaption>
  </CommentContainer>
)

const EntryComponentsByType: Record<string, React.FC> = {
  track: Track,
  comment: Comment,
}

const Page: NextPage<Props> = ({ playlist }) => {
  if (!playlist) {
    return null
  }

  return (
    <Main>
      <Stack>
        <h1>{playlist.name}</h1>
        <dl>
          <dt>Curators</dt>
          <dd>
            {playlist.curators
              .map(({ person }) =>
                [person.firstName, person.lastName].join(' '),
              )
              .join(', ')}
          </dd>
          <dt>Tracks</dt>
          <dd>{playlist.trackCount}</dd>
          <dt>Comments</dt>
          <dd>{playlist.commentCount}</dd>
        </dl>
        <Stack>
          {playlist.tracks.map((track, index) => {
            const Component = EntryComponentsByType[track._type]
            return <Component key={index} {...track} />
          })}
        </Stack>
      </Stack>
    </Main>
  )
}

export default Page

export const getStaticProps: GetStaticProps<Props> = async request => {
  const playlist = await sanity.fetch(
    groq`
    *[_type == 'playlist' && slug.current == $slug][0]{
      _id,
      name,
      'trackCount': count(tracks[_type == 'track']),
      'commentCount': count(tracks[_type == 'comment']),
      curators[]->{
        person{
          firstName,
          lastName
        }
      },
      'mosaic': tracks[_type == 'track'][0..3]{
        _type,
        _type == 'track' => @->{
          'albumName': album->name,
          'color': album->image.asset->metadata.palette.dominant.background,
          'imageUrl': album->appleMusicImageUrl
        }
      },
      tracks[]{
        _type,
        _type == 'track' => @->{
          name,
          artists[]->{
            name
          },
          album->{
            name,
            'color': image.asset->metadata.palette.dominant.background,
            appleMusicImageUrl
          }
        },
        _type == 'comment' => @{
          comment,
          curator->{
            person{
              firstName,
              lastName
            }
          }
        },
      }
    }
  `,
    {
      slug: request.params.slug,
    },
  )

  if (!playlist) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      playlist,
    },
    revalidate: 60
  }
}

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: true,
})
