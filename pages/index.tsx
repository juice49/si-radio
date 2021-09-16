import { NextPage, GetStaticProps } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import groq from 'groq'
import { styled } from '../stitches.config'
import sanity from '../lib/sanity'
import getAppleMusicImageUrl from '../lib/get-apple-music-image-url'
import Stack from '../components/stack'

const Text = styled('p', {})

const Main = styled('main', {
  padding: '10rem',
})

const AlbumArt = styled('div', {
  display: 'grid',
  overflow: 'hidden',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gridTemplateRows: 'repeat(2, 1fr)',
  aspectRatio: 1,
  backgroundColor: '#eaeaea',
  '& > *:nth-child(1)': {
    backgroundColor: 'var(--mosaic-color-0)',
  },
  '& > *:nth-child(2)': {
    backgroundColor: 'var(--mosaic-color-1)',
  },
  '& > *:nth-child(3)': {
    backgroundColor: 'var(--mosaic-color-2)',
  },
  '& > *:nth-child(4)': {
    backgroundColor: 'var(--mosaic-color-3)',
  },
})

const SparseGrid = styled('div', {
  display: 'grid',
  gap: '3rem',
  // gridAutoRows: '10vw',
  gridTemplateColumns: 'repeat(5, 1fr)',
})

interface MosaicEntry {
  albumName: string
  color: string
  imageUrl: string
}

interface Props {
  playlists: {
    _id: string
    name: string
    slug: string
    curators: {
      person: {
        firstName: string
        lastName: string
      }
    }[]
    mosaic: MosaicEntry[]
  }[]
}

const Page: NextPage<Props> = ({ playlists }) => {
  return (
    <>
      <Main>
        <SparseGrid>
          {playlists.map((playlist, index) => (
            <Link href={`/playlists/${encodeURIComponent(playlist.slug)}`}>
              <a>
                <Stack>
                  <AlbumArt
                    key={index}
                    style={getMosaicCustomProperties(playlist.mosaic)}
                  >
                    {playlist.mosaic?.map((mosaicEntry, index) => (
                      <Image
                        key={index}
                        width={400}
                        height={400}
                        alt=''
                        src={getAppleMusicImageUrl(mosaicEntry.imageUrl, 400)}
                        layout='responsive'
                      />
                    ))}
                  </AlbumArt>
                  <Text>{playlist.name}</Text>
                </Stack>
              </a>
            </Link>
          ))}
        </SparseGrid>
      </Main>
    </>
  )
}

export default Page

export const getStaticProps: GetStaticProps<Props> = async () => {
  const playlists = await sanity.fetch(groq`
    *[_type == 'playlist']{
      _id,
      name,
      'slug': slug.current,
      curators[]->{
        person{
          firstName,
          lastName
        }
      },
      // Get the album art of the first four tracks. Is there a way to find
      // the first four tracks with unique albums?
      'mosaic': tracks[_type == 'track'][0..3]{
        _type == 'track' => @->{
          'albumName': album->name,
          'color': album->image.asset->metadata.palette.dominant.background,
          'imageUrl': album->appleMusicImageUrl
        },
      }
    }
  `)

  return {
    props: {
      playlists,
    },
    revalidate: 60,
  }
}

function getMosaicCustomProperties(
  mosaic: MosaicEntry[],
): Record<string, string> {
  return Array.from({ length: 4 }).reduce<Record<string, string>>(
    (reduced, _, index) => ({
      ...reduced,
      [`--mosaic-color-${index}`]:
        mosaic?.[index]?.color ?? mosaic?.[0]?.color ?? 'transparent',
    }),
    {},
  )
}
