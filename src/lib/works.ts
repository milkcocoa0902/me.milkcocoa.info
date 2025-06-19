import {StaticImageData} from "next/image";
import CocoaDiskInfo from "../../public/assets/works/CocoaDiskInfo.png";
import NoteForBabyFood from "../../public/assets/works/GoodByeMilk.jpg";
import CocoaZip from "../../public/assets/works/CocoaZip.jpg";
import CocoaTweet from "../../public/assets/works/cocoatweet.png";
import PantoryKeeper from "../../public/assets/works/pantrykeeper.jpg";
import Petlog from "../../public/assets/works/petlog.png";
import LatteIcon from "../../public/assets/works/latte.png"
import CrimsonIcon from "../../public/assets/works/Crimson.png"
import ColotokIcon from "../../public/assets/works/Colotok.png"
export type WorkItem = {
    id: string,
    title: string,
    description: string,
    image: StaticImageData,
    href: string
}

const items: WorkItem[] = [
    {
        id: crypto.randomUUID().toString(),
        title: 'CocoaDiskInfo',
        description: 'Simple S.M.A.R.T. viewer for Linux',
        image: CocoaDiskInfo,
        href: 'https://github.com/koron0902/CocoaDiskInfo',
    },
    {
        id: crypto.randomUUID().toString(),
        title: '離乳食手帳',
        description: '日々の離乳食を記録するためのAndroidアプリ',
        image: NoteForBabyFood,
        href: 'https://play.google.com/store/apps/details?id=com.milkcocoa.info.goodbyemilk',
    },
    {
        id: crypto.randomUUID().toString(),
        title: 'CocoaZip',
        description: 'python製のZIPアーカイバ',
        image: CocoaZip,
        href: 'https://github.com/koron0902/CocoaZip',
    },
    {
        id: crypto.randomUUID().toString(),
        title: 'CocoaTweet',
        description: 'C++ユーザのためのパワフルで使いやすいTwitter API Library',
        image: CocoaTweet,
        href: 'https://github.com/koron0902/CocoaTweet',
    },
    {
        id: crypto.randomUUID().toString(),
        title: 'くらもり',
        description: '食材管理の決定版アプリ',
        image: PantoryKeeper,
        href: 'https://play.google.com/store/apps/details?id=com.milkcocoa.info.pantrykeeper',
    },
    {
        id: crypto.randomUUID().toString(),
        title: 'ぺったん',
        description: 'ペット飼い向けSNSアプリ',
        image: Petlog,
        href: 'https://petlog.milkcocoa.info',
    },
    {
        id: crypto.randomUUID().toString(),
        title: 'Colotok',
        description: 'Kotlin向けログライブラリ',
        image: ColotokIcon,
        href: 'https://github.com/milkcocoa0902/Colotok',
    },
    {
        id: crypto.randomUUID().toString(),
        title: 'Crimson',
        description: 'Kotlin/Ktor向けのWebSocketライブラリ',
        image: CrimsonIcon,
        href: 'https://github.com/milkcocoa0902/Crimson',
    },
    {
        id: crypto.randomUUID().toString(),
        title: 'Latte',
        description: '日本郵政デジタルアドレスAPIのKotlinライブラリ',
        image: LatteIcon,
        href: 'https://github.com/milkcocoa0902/Latte',
    },
]

export const workItems = (limit: number, offset: number) => {
    return items.toReversed().slice(offset, offset + limit)
}

export const workCount = () => {
    return items.length
}