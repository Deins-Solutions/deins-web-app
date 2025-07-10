'use client'; // This page now needs to be a client component to call configureAmplify

import { Suspense, useEffect } from 'react';
import { inter, interTight } from '../../fonts';
import AuthForm from './form'; // Assuming your form is now named AuthForm
import { configureAmplify } from '@/lib/amplify-config';

export default function RegisterPage() {
  // Configure Amplify once when the component mounts
  useEffect(() => {
    configureAmplify();
  }, []);

  return (
    <div className="page">
      <section className="registerVid pt-10 flex justify-center ">
        <div className="flex justify-center bg-black items-center h-80 w-60 overflow-hidden translate-z-1 rounded-4xl border border-solid p-10px">
          <Suspense fallback={<p>Loading video...</p>}>
            <video className="h-80" autoPlay muted loop preload="none" aria-label="Video player">
              <source src={'https://deins.s3.eu-central-1.amazonaws.com/video/card/spinCard.mp4'} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Suspense>
        </div>
      </section>
     <section className={`${interTight.className} text-center px-4`}>
          <h1 className="pt-14 text-2xl font-bold">
            Sammeln. Unterstützen. Gewinnen
          </h1>
        </section>
        <section className={`${inter.className} text-center px-4`}>
          <p className="pt-4 text-base font-bold">
            Jede Sammelkarte nimmt an der KloppoCar Dauerverlosung teil.
          </p>
        </section>
      <AuthForm />
    </div>
  );
}
