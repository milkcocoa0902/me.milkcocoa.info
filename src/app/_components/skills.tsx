import React from "react";
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
      <div className="flex flex-col m-2 px-2 py-0.5 bg-[#e6e6e6] text-[#333333]">
          <h2 className="text-black text-2xl font-bold">
              Skills
          </h2>
          <div 
            className="grid gap-x-[4.3333%] justify-center"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 20%))" }}
          >
              {
                  skillStack.map((stack: SkillStack) => (
                      <div className="flex flex-col items-center m-2" key={stack.id}>
                          <h3 className="text-black text-lg font-bold">
                              {stack.category}
                          </h3>
                          {
                              stack.skills.map((skill: Skill) => (
                                  <div className="flex items-center m-2 gap-2" key={skill.id}>
                                      {
                                          skill.image && (
                                              <img
                                                  width={20}
                                                  height={20}
                                                  src={skill.image}
                                                  alt=""
                                              />
                                          )
                                      }
                                      {skill.name}
                                  </div>
                              ))
                          }
                      </div>
                  ))
              }
          </div>
      </div>
  )
};