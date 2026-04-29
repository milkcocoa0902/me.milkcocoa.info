import { RiAccountCircleFill } from 'react-icons/ri'
import { HiMail } from 'react-icons/hi'
import { HiBuildingOffice2 } from 'react-icons/hi2'
import { FaBirthdayCake } from 'react-icons/fa'
import { Works } from ".//_components/works";
import {Skills} from ".//_components/skills";

export default function Home() {
    return (
        <div className="bg-white p-4 my-4 rounded-2xl">
            <div className="flex flex-col m-2 px-2 py-0.5 bg-[#e6e6e6] text-[#333333] gap-2">
                <h2 className="text-black text-2xl font-bold"> Profile
                </h2>
                <div className="flex items-center gap-4">
                    <RiAccountCircleFill size={32} color={'#000'}/>
                    ここあ
                </div>
                <div className="flex items-center gap-4">
                    <HiBuildingOffice2 size={32} color={'#000'}/>
                    Cocoa Tech. Lab
                </div>
                <div className="flex items-center gap-4">
                    <FaBirthdayCake size={32} color={'#000'}/>
                    SEP.2, 1996
                </div>
                <div className="flex items-center gap-4">
                    <HiMail size={32} color={'#000'}/>
                    developer@milkcocoa.info
                </div>
            </div>
            <div data-iframe-width="150" data-iframe-height="270" data-share-badge-id="a75677ae-790f-4c80-b519-b82bdec98eae" data-share-badge-host="https://www.credly.com"></div><script type="text/javascript" async src="//cdn.credly.com/assets/utilities/embed.js"></script>
            <Skills/>
            <Works/>
        </div>
    );
};