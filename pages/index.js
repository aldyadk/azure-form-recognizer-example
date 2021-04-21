import Head from 'next/head'
import styles from '../styles/Home.module.css'
import axios from 'axios'
import { useState } from 'react'

export default function Home() {
  const [resultData, setResultData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = () => {
    setIsLoading(true)
    const file = document.getElementById('test-input').files[0]
    if (!file) {
      setIsLoading(false)
      return
    }
    if (file.type == "application/pdf") {
      // UNTUK PDF
      const formData = new FormData();
      formData.append('pdf-file', file)
      axios.post(
        '/api/handlePDF',
        formData,
        {
          headers: { 'content-type': 'multipart/form-data' },
          onUploadProgress: (event) => {
            console.log(`Current progress:`, Math.round((event.loaded * 100) / event.total));
          }
        },
      )
        .then(({ data: { result } }) => {
          setIsLoading(false)
          setResultData(result)
          setIsLoading(false)
        })
        .catch(err => {
          setIsLoading(false)
          console.log(err)
        })
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>
        <input id="test-input" type="file" accept=".pdf" onChange={handleFileChange} />
        {isLoading ? (
          <h1>Loading.....</h1>
        ) : (
          <>
            <button onClick={() => alert('TO DO: lakukan upload!')}>Misalkan Ini Button Upload</button>
            <div style={{ width: '80vw', margin: 'auto', minHeight: '50vh', background: '#ADD8E6' }}>
              {resultData.map((v, i) => (
                <table key={i} style={{ marginBottom: 50, border: '1px solid black', borderCollapse: 'collapse' }}>
                  {v.split('\n').map((vv, ii) => (
                    <tr key={ii} style={{ border: '1px solid black', borderCollapse: 'collapse' }}>
                      {vv.split("|||").map((vvv, iii) => (
                        <td key={iii} style={{ border: '1px solid black', borderCollapse: 'collapse' }}>{vvv}</td>
                      ))}
                    </tr>
                  ))}
                </table>
              ))}
            </div>
            {/* <div style={{ width: '80vw', margin: 'auto', minHeight: '100vh', background: '#1F75FE', color: 'white' }}>
              {JSONdata.split('\n').map((v, i) => (
                <div key={i}>{v}</div>
              ))}
            </div> */}
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  )
}
