import { Box, VStack, Text, Heading, HStack, css, k } from "@kuma-ui/core";
import { RiAccountCircleFill } from 'react-icons/ri'
import { HiMail } from 'react-icons/hi'
import { HiBuildingOffice2 } from 'react-icons/hi2'
import { FaBirthdayCake } from 'react-icons/fa'
import { Achievements } from './_components/achievenents'
import { Works } from ".//_components/works";
import { Footer } from ".//_common/footer";
import { Header } from ".//_common/header";
import { ContentContainer } from ".//_common/contentContainer";
import { Main } from ".//_common/main";
export default function Home() {
  return (
      <ContentContainer>
        <Header />
        {/* main content */}
        <Main>
          <Box bgColor={"white"} p={"16px 16px"} m={"16px 0"} borderRadius={"16px"}>
            <VStack m={16} p={8} bg="#e6e6e6" color="#333333" gap={8}>
              <Heading as="h2" color="black" fontSize="24px"> Profile
              </Heading>
              <HStack alignItems="center" gap={16}>
                  <RiAccountCircleFill size={32} color={'#000'} />
                ここあ
              </HStack>
              <HStack alignItems="center" gap={16}>
                  <HiBuildingOffice2 size={32} color={'#000'} />
                  Cocoa Tech. Lab
              </HStack>
              <HStack alignItems="center" gap={16}>
                  <FaBirthdayCake size={32} color={'#000'} />
                SEP.2, 1996
              </HStack>
              <HStack alignItems="center" gap={16}>
                  <HiMail size={32} color={'#000'} />
                developer@milkcocoa.info
              </HStack>
            </VStack>
            <Achievements />
            <Works />
          </Box>
        </Main>

        {/* footer */}
        <Footer />
      </ContentContainer>
  );
};