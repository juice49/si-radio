import { AppProps } from 'next/app'
import Link from 'next/link'
import { styled, globalCss } from '../stitches.config'

const globalStyles = globalCss({
  body: {
    /* padding: '$space$1', */
    fontFamily: '$system',
    /* backgroundColor: '#000', */
    color: '#888',
  },
  '*': {
    margin: 0,
    padding: 0,
  },
})

const Page = ({ Component, pageProps }: AppProps) => {
  globalStyles()

  return (
    <>
      <Head>
        <h1>
          <Link href='/'>
            <a>Si Radio</a>
          </Link>
        </h1>
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default Page

const Head = styled('header', {
  padding: '1rem',
  borderBottom: '1px solid #000',
})
