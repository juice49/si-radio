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
    trackCount: number | null
    commentCount: number | null
    curators:
      | {
          person: {
            firstName: string
            lastName: string
          }
        }[]
      | null
    mosaic: MosaicEntry[] | null
    entries: (Track | Comment)[] | null
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

const TrackComponent: React.FC<Track> = ({ name, artists, album }) => (
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

const CommentComponent: React.FC<Comment> = ({ comment, curator }) => (
  <CommentContainer as='figure'>
    <blockquote>{comment}</blockquote>
    <figcaption>
      {[curator.person.firstName, curator.person.lastName].join(' ')}
    </figcaption>
  </CommentContainer>
)

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
            {(playlist.curators ?? [])
              .map(({ person }) =>
                [person.firstName, person.lastName].join(' '),
              )
              .join(', ')}
          </dd>
          <dt>Tracks</dt>
          <dd>{playlist.trackCount ?? 0}</dd>
          <dt>Comments</dt>
          <dd>{playlist.commentCount ?? 0}</dd>
        </dl>
        <Stack>
          {(playlist.entries ?? []).map((entry, index) => {
            switch (entry._type) {
              case 'track':
                return <TrackComponent key={index} {...entry} />
              case 'comment':
                return <CommentComponent key={index} {...entry} />
            }
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
      'trackCount': count(entries[_type == 'track']),
      'commentCount': count(entries[_type == 'comment']),
      curators[]->{
        person{
          firstName,
          lastName
        }
      },
      'mosaic': entries[_type == 'track'][0..3]->{
        'albumName': album->name,
        'color': album->image.asset->metadata.palette.dominant.background,
        'imageUrl': album->appleMusicImageUrl
      },
      entries[]{
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
      slug: request.params?.slug,
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
    revalidate: 60,
  }
}

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: true,
})
