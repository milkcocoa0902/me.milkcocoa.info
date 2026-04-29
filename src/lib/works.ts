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

type Work = {
    title: string
    description: string
    stack: string[]
    href?: string
    image: StaticImageData
}

type WorkInternal = Work & {
    id: number
}

const items: WorkInternal[] = [
    {
        id: 0,
        title: 'Colotok',
        description: 'Powerful logging library for Kotlin Multiplatform',
        stack: ['Kotlin', 'KMP', 'Logging'],
        image: ColotokIcon,
        href: 'https://github.com/milkcocoa0902/Colotok',
    },
    {
        id: 1,
        title: 'CocoaDiskInfo',
        description: 'Simple S.M.A.R.T. viewer for Linux',
        stack: ['C++', 'Linux', 'S.M.A.R.T'],
        image: CocoaDiskInfo,
        href: 'https://github.com/koron0902/CocoaDiskInfo',
    },
    {
        id: 2,
        title: 'Latte',
        description: 'Kotlin library for Japanese postal digital address API',
        stack: ['Kotlin', 'API'],
        image: LatteIcon,
        href: 'https://github.com/milkcocoa0902/Latte',
    },
    {
        id: 3,
        title: '離乳食手帳',
        description: '日々の離乳食を記録するためのAndroidアプリ',
        stack: ['Android', 'Kotlin'],
        image: NoteForBabyFood,
        href: 'https://play.google.com/store/apps/details?id=com.milkcocoa.info.goodbyemilk',
    },
    {
        id: 4,
        title: 'CocoaZip',
        description: 'python製のZIPアーカイバ',
        stack: ['Python', 'Zip'],
        image: CocoaZip,
        href: 'https://github.com/koron0902/CocoaZip',
    },
    {
        id: 5,
        title: 'CocoaTweet',
        description: 'C++ユーザのためのパワフルで使いやすいTwitter API Library',
        stack: ['C++', 'Twitter', 'API'],
        image: CocoaTweet,
        href: 'https://github.com/koron0902/CocoaTweet',
    },
    {
        id: 6,
        title: 'くらもり',
        description: '食材管理の決定版アプリ',
        stack: ['Android', 'Kotlin'],
        image: PantoryKeeper,
        href: 'https://play.google.com/store/apps/details?id=com.milkcocoa.info.pantrykeeper',
    },
    {
        id: 7,
        title: 'ぺったん',
        description: 'ペット飼い向けSNSアプリ',
        stack: ['Android', 'Kotlin'],
        image: Petlog,
        href: 'https://petlog.milkcocoa.info',
    },
    {
        id: 8,
        title: 'Crimson',
        description: 'Kotlin/Ktor向けのWebSocketライブラリ',
        stack: ['Kotlin', 'Ktor', 'WebSocket'],
        image: CrimsonIcon,
        href: 'https://github.com/milkcocoa0902/Crimson',
    },
]

export const workItems = (limit: number, offset: number): Work[] => {
    return items
        .toSorted((a, b) => a.id - b.id)
        .slice(offset, offset + limit)
        .map((item) => ({ ...item }))
}

export const workCount = () => {
    return items.length
}