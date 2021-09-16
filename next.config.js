module.exports = {
  async redirects() {
    return [
      {
        source: '/playlists',
        destination: '/',
        permanent: false,
      },
    ]
  },
  images: {
    domains: [
      'is1-ssl.mzstatic.com',
      'is2-ssl.mzstatic.com',
      'is3-ssl.mzstatic.com',
      'is4-ssl.mzstatic.com',
      'is5-ssl.mzstatic.com',
    ],
  },
}
