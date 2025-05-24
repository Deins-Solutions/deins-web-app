import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { inter, interTight } from '../../fonts'
import Form from './form';
import { Suspense } from 'react'

export default async function RegisterPage() {
 const session = await getServerSession();
 if(session) {
    redirect("/")
 }

 return (
  <div className="page">
      <section className="registerVid pt-10 flex justify-center " >
      <div className="flex justify-center bg-black items-center h-80 w-60 overflow-hidden translate-z-1 rounded-4xl border border-solid p-10px">
      <Suspense fallback={<p>Loading video...</p>}>
      <video className="h-80" autoPlay muted loop preload="none" aria-label="Video player">
        <source src={'https://deins.s3.eu-central-1.amazonaws.com/video/card/spinCard.mp4'} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      </Suspense>
      </div>
      {/* Other content of the page */}
    </section>
    <section className={`${interTight.className} flex justify-center items-center` }>
      <p className=" pt-14 text-xl font-bold" >
       Wer sammelt, gewinnt
      </p>
      </section>
      <section className={`${inter.className}` }>
      <div className="flex justify-center items-center"> <p className=" pt-6 text-l font" >
       Sichere dir die Chance auf ein Treffen mit Jürgen Klopp –
      </p></div>
      <div className="flex justify-center items-center"> <p className="text-l font" >
       Digital sammeln, real erleben!
      </p></div>
      </section>
     <Form /> 
     </div>
 );
}