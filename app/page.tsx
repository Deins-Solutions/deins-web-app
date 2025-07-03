import { Collectible } from "./collectible"
import { inter, interTight } from './fonts'
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

async function getCollectibleUrl(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return null;
    }

    // --- Fetch User Data ---
    // The response is now the user object directly
    const userResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/db/user?email=${userEmail}`);
    if (!userResponse.ok) throw new Error('Failed to fetch user');
    const user = await userResponse.json();
    const userId = user.userId;

    // --- Fetch User Collectible Data ---
    // The response is now an array of collectibles
    const userCollectibleResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/db/userCollectible?userId=${userId}`);
    if (!userCollectibleResponse.ok) throw new Error('Failed to fetch user collectible');
    const userCollectibles = await userCollectibleResponse.json();
    // Safely get the first collectible's ID
    const collectibleId = userCollectibles[0]?.collectibleId;

    if (!collectibleId) {
      return null;
    }

    // --- Fetch Collectible Data ---
    // The response is now the collectible object directly
    const collectibleResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/db/collectible?collectibleId=${collectibleId}`);
    if (!collectibleResponse.ok) throw new Error('Failed to fetch collectible details');
    const collectible = await collectibleResponse.json();
    // Safely get the URL from the object
    const collectibleUrl = collectible.embedRef?.url;

    return collectibleUrl;
  } catch (error) {
    console.error("Error in getCollectibleUrl:", error);
    return null;
  }
}

export default async function RootPage() {
  const interFont = inter;
  const interTightFont = interTight;
  const getUrl = await getCollectibleUrl()

  return <div>
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
        <div className="flex justify-center items-center max-w-200 mx-auto"> <p className=" pt-6 text-l font" >
         Mit jeder weiteren Karte wächst deine Chance auf das Treffen mit <span className='font-bold'>Jürgen Klopp und andere exklusive Preise.</span> Tausche, sammle und sichere dir deinen Platz, sobald unsere App verfügbar ist. Wenn es soweit ist, informieren wir dich.
        </p></div>
    </section>
  </div>
}