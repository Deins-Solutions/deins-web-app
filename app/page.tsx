import { Collectible } from "./collectible"
import { inter, interTight } from './fonts'
import Image from 'next/image';
import iosdl from '@/public/images/iosdl.svg';
import androiddl from '@/public/images/androiddl.svg'
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
      <section className={`${interTightFont.className} text-center px-4 pt-8`}>
        <h1 className="text-3xl font-bold text-gray-900">
          Super! Das hat geklappt
        </h1>
      </section>

      <section className={`${interFont.className} text-center px-6 pt-4 text-gray-800`}>
        <p className="text-lg font-bold">
          Deine erste Sammelkarte ist sichergestellt. Und jetzt?
        </p>
        <p className="pt-6 text-base font-bold leading-relaxed">
          Um weitere Karten zu sammeln, Codes einzulösen und deine Sammlung zu verwalten, lade dir die kostenfreie DEINS app herunter.
        </p>
        <p className="pt-4 text-base font-bold leading-relaxed">
          Weitere Infos und deine Karte warten in der App.
        </p>
      </section>
      <section className="pt-8 px-6">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {/* Apple App Store Button */}
          <a href="https://apps.apple.com/us/app/deins-scannen-sammeln/id6743440325" target="_blank" rel="noopener noreferrer" className="block transform hover:scale-105 transition-transform duration-200">
            <Image
              src={iosdl}
              alt="Download on the App Store"
              width={180}
              height={60}
              className="h-auto"
            />
          </a>
          {/* Google Play Store Button */}
          <a href="https://play.google.com/store/apps/details?id=com.deins.deins_app" target="_blank" rel="noopener noreferrer" className="block transform hover:scale-105 transition-transform duration-200">
            <Image
              src={androiddl}
              alt="Get it on Google Play"
              width={180}
              height={60}
              className="h-auto"
            />
          </a>
        </div>
      </section>
      
    </div>
  );
}