import {Box, Grid, Heading, HStack, Text, VStack, Image} from "@kuma-ui/core";
import React from "react";
import {Card} from "@/app/_components/card";
import {randomUUID} from "node:crypto";


type Skill = {
    id: string,
    name: string,
    image: string | null,
}

type SkillStack = {
    id: string,
    category: string,
    skills: Skill[],
}

const skillStack: SkillStack[] = [
    {
        category: "主な使用言語",
        skills: [
            {
                id: randomUUID(),
                name: "Kotlin",
                image: "https://cdn.simpleicons.org/kotlin",
            },
            {
                id: randomUUID(),
                name: "Python",
                image: "https://cdn.simpleicons.org/python",
            },
            {
                id: randomUUID(),
                name: "TypeScript",
                image: "https://cdn.simpleicons.org/typescript",
            },
        ],
        id: randomUUID()
    },
    {
        category: "フレームワーク",
        skills: [
            {
                id: randomUUID(),
                name: "Kotlin Multiplatform",
                image: null,
            },
            {
                id: randomUUID(),
                name: "Ktor (w/ Exposed)",
                image: "https://cdn.simpleicons.org/ktor",
            },
            {
                id: randomUUID(),
                name: "Vue.js",
                image: "https://cdn.simpleicons.org/vuedotjs",
            },
            {
                id: randomUUID(),
                name: "React",
                image: "https://cdn.simpleicons.org/react",
            },
            {
                id: randomUUID(),
                name: "Django",
                image: "https://cdn.simpleicons.org/django",
            },
        ],
        id: randomUUID()
    },
    {
        category: "データベース",
        skills: [
            {
                id: randomUUID(),
                name: "PostgreSQL",
                image: "https://cdn.simpleicons.org/postgresql",
            },
            {
                id: randomUUID(),
                name: "Redis",
                image: "https://cdn.simpleicons.org/redis",
            },
        ],
        id: randomUUID()
    },
    {
        category: "インフラ・ツール",
        skills: [
            {
                id: randomUUID(),
                name: "AWS",
                image: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg",
            },
            {
                id: randomUUID(),
                name: "Docker",
                image: "https://cdn.simpleicons.org/docker",
            },
            {
                id: randomUUID(),
                name: "Postman",
                image: "https://cdn.simpleicons.org/postman",
            },
        ],
        id: randomUUID()
    },
]


export const Skills = () => {
  return (
      <VStack m={"8px 16px"} p={"2px 8px"} bg="#e6e6e6" color="#333333" >
          <Heading as="h2" color="black" fontSize="24px">
              Skills
          </Heading>
          <Grid  gridTemplateColumns={"repeat(auto-fit, minmax(300px, 20%))"} columnGap={"4.3333%"} justifyContent={"center"}>
              {
                  skillStack.map((stack: SkillStack) => (
                      <VStack alignItems={"center"} m={["8px 8px"]} key={stack.id}>
                          <Heading as="h3" color="black" fontSize="18px">
                              {stack.category}
                          </Heading>
                          {
                              stack.skills.map((skill: Skill) => (
                                  <HStack m={["8px 8px"]} key={skill.id} alignItems={"center"} gap={8}>
                                      {
                                          skill.image && (
                                              <Image
                                                  width={20}
                                                  height={20}
                                                  src={skill.image}
                                                  alt=""
                                              />
                                          )
                                      }
                                      {skill.name}
                                  </HStack>
                              ))
                          }
                      </VStack>
                  ))
              }
          </Grid>
      </VStack>
  )
};