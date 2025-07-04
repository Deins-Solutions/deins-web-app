import { Collectible } from "./collectible"
import { inter, interTight } from './fonts'
import { getServerSession } from 'next-auth';
import { authOptions, ExtendedSession } from '@/lib/auth';
import Logout from "./logout";
import { getUserFromApi, getUserCollectiblesFromApi, getCollectibleFromApi } from "@/lib/api";

async function getCollectibleUrl(): Promise<string | null> {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    const session: ExtendedSession | null = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const token = session?.idToken;

    if (!userEmail || !token) {
      return null;
    }

    let user;
    for (let i = 0; i < 5; i++) {
        try {
            user = await getUserFromApi(token, userEmail);
            if (user) break; // Success, exit loop
        } catch (error) {
          console.log(error);
            if (i < 4) {
                console.log(`getCollectibleUrl: Failed to fetch user directly, retrying... Attempt ${i + 1}`);
                await delay(500);
            } else {
                throw new Error('Failed to fetch user after multiple attempts');
            }
        }
    }

    if (!user) {
        throw new Error('User object is undefined after successful fetch loop.');
    }
    
    const userId = user.userId;

    // --- Update other calls to use direct helpers ---
    const userCollectibles = await getUserCollectiblesFromApi(token, userId);
    const collectibleId = userCollectibles[0]?.collectibleId;

    if (!collectibleId) {
      return null;
    }

    const collectible = await getCollectibleFromApi(token, collectibleId);
    const collectibleUrl = collectible.embedRef?.url;

    return collectibleUrl;
  } catch (error) {
    console.error("Error in getCollectibleUrl:", error);
    return null;
  }
}

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  const interFont = inter;
  const interTightFont = interTight;
  const getUrl = await getCollectibleUrl();

  return (
    <div className="max-w-2xl mx-auto relative">
      {session && (
        <div className="absolute top-0 right-0 pt-2 pr-2 z-10">
          <Logout />
        </div>
      )}

      <section className="Collectible Preview pt-6">
          <Collectible url={getUrl || 'https://deins.s3.eu-central-1.amazonaws.com/Objects3d/kloppocar/KloppoCar_01.gltf'} />
      </section>
      <section className={`${interTightFont.className} flex justify-center items-center` }>
        <p className="text-2xl" >
          Wer sammelt, gewinnt
        </p>
        </section>
        <section className={`${interFont.className}`}>
         <div className="flex justify-center items-center"> <p className=" pt-6 text-l text-bold font" >
           Und du hast gerade deinen ersten Schritt gemacht
          </p></div>
          <div className="flex justify-center items-center"> 
            <p className="pt-6 text-l font text-center px-4">
              Mit jeder weiteren Karte wächst deine Chance auf das Treffen mit <span className='font-bold'>Jürgen Klopp und andere exklusive Preise.</span> Tausche, sammle und sichere dir deinen Platz, sobald unsere App verfügbar ist. Wenn es soweit ist, informieren wir dich.
            </p>
          </div>
        </section>
    </div>
  );
}