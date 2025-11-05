"use client";

import { MoreHorizontal, Plus, Calendar, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Issue {
  id: string;
  title: string;
  tag: string | null;
  tagColor?: string;
  dueDate?: string;
  startDate?: string;
  status?: string;
  assignee?: boolean;
  assignees?: number;
  completed?: boolean;
}

interface IssueSection {
  section: string;
  count: number;
  items: Issue[];
}

const issues: IssueSection[] = [
  {
    section: "In Progress",
    count: 2,
    items: [
      {
        id: "ENG-248",
        title: "Release new website",
        tag: "Magic",
        tagColor: "bg-pink-500",
        dueDate: "Oct 12",
        startDate: "12 Oct",
        status: "warning",
        assignee: true,
      },
      {
        id: "ENG-250",
        title: "Design translucent assets",
        tag: "Design",
        tagColor: "bg-pink-500",
        dueDate: "Oct 12",
        startDate: "11 Oct",
        status: "warning",
        assignee: true,
      },
    ],
  },
  {
    section: "Backlog",
    count: 3,
    items: [
      {
        id: "ENG-028",
        title: "Update documentation",
        tag: null,
        dueDate: "30 Sep",
        assignees: 2,
      },
      {
        id: "ENG-199",
        title: "Batch loading of partial stores",
        tag: "SuperSync",
        tagColor: "bg-purple-500",
        dueDate: "5 Sep",
        assignee: true,
      },
      {
        id: "ENG-201",
        title: "Fix CSS in roadmap team graph",
        tag: "Bug",
        tagColor: "bg-red-500",
        dueDate: "5 Sep",
        assignee: true,
      },
    ],
  },
  {
    section: "Icebox",
    count: 2,
    items: [
      {
        id: "ENG-344",
        title: "Enable data transmission beams",
        tag: null,
        dueDate: "Oct 20",
        startDate: "8 Oct",
        assignee: true,
      },
      {
        id: "ENG-402",
        title: "Tease the upcoming product release",
        tag: "Marketing",
        tagColor: "bg-blue-500",
        dueDate: "Oct 19",
        startDate: "27 Sep",
        assignee: true,
      },
    ],
  },
  {
    section: "Done",
    count: 4,
    items: [
      {
        id: "ENG-249",
        title: "Replace isometric screenshots",
        tag: "Design",
        tagColor: "bg-pink-500",
        dueDate: "12 Oct",
        assignee: true,
        completed: true,
      },
      {
        id: "ENG-247",
        title: "Add magical details",
        tag: "Magic",
        tagColor: "bg-pink-500",
        dueDate: "11 Oct",
        assignee: true,
        completed: true,
      },
      {
        id: "ENG-241",
        title: "Create router for view link unfurling",
        tag: "#8992",
        tagColor: "bg-green-500",
        dueDate: "10 Oct",
        assignee: true,
        completed: true,
      },
      {
        id: "ENG-220",
        title: "Gather feedback from customers",
        tag: "Testing",
        tagColor: "bg-yellow-500",
        dueDate: "Oct 25",
        startDate: "11 Oct",
        assignee: true,
        completed: true,
      },
    ],
  },
];

export function IssuesBoard() {
  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">
                🚀
              </div>
              <span className="text-white font-normal">Project Solar Sailer</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
              <Calendar className="w-3 h-3 mr-1" />
              Updates
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-[#20222f] hover:bg-[#272936]">
              <UsersIcon className="w-3 h-3 text-gray-300" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-[#20222f] hover:bg-[#272936]">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#20222f] px-3 py-1.5 rounded-md">
            <div className="text-[10px] text-blue-400">&lt;/&gt;</div>
            <span className="text-sm text-white font-normal">Engineering</span>
            <span className="text-xs text-gray-400">89%</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-300 hover:bg-[#20222f] font-normal">
            + Filter
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7 bg-[#20222f] hover:bg-[#272936]">
              <div className="w-3 h-3 flex flex-col gap-0.5">
                <div className="h-0.5 bg-gray-400"></div>
                <div className="h-0.5 bg-gray-400"></div>
                <div className="h-0.5 bg-gray-400"></div>
              </div>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#20222f]">
              <div className="w-3 h-3 grid grid-cols-2 gap-0.5">
                <div className="bg-gray-400"></div>
                <div className="bg-gray-400"></div>
                <div className="bg-gray-400"></div>
                <div className="bg-gray-400"></div>
              </div>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-300 hover:bg-[#20222f] font-normal">
              View
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {issues.map((section) => (
            <div key={section.section} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                    {section.section === "Done" ? (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-[#0d0d0d] rounded-full"></div>
                    )}
                  </div>
                  <span className="text-sm font-normal text-white">{section.section}</span>
                  <span className="text-xs text-gray-500">{section.count}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto">
                  <Plus className="w-3 h-3 text-gray-400" />
                </Button>
              </div>

              <div className="space-y-2">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-[#1c1e2b] cursor-pointer group"
                  >
                    <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-3 h-3 text-gray-400" />
                    </Button>

                    <span className="text-xs text-gray-500 font-mono">{item.id}</span>

                    <div className="flex items-center gap-2">
                      {item.completed && (
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 text-white">✓</div>
                        </div>
                      )}
                      {!item.completed && item.status === "warning" && (
                        <div className="w-4 h-4 rounded-full border-2 border-yellow-500"></div>
                      )}
                      {!item.completed && !item.status && (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-600"></div>
                      )}
                    </div>

                    <span className="text-sm text-gray-300 font-normal">{item.title}</span>

                    <div className="ml-auto flex items-center gap-2">
                      {item.tag && (
                        <Badge
                          variant="secondary"
                          className={`text-xs h-5 ${item.tagColor} bg-opacity-20 text-white border-0`}
                        >
                          {item.tag}
                        </Badge>
                      )}

                      {item.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{item.dueDate}</span>
                        </div>
                      )}

                      {item.startDate && (
                        <span className="text-xs text-gray-500">{item.startDate}</span>
                      )}

                      {item.assignee && (
                        <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-[10px]">
                          A
                        </div>
                      )}

                      {item.assignees && (
                        <div className="flex items-center">
                          <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-[10px]">
                            {item.assignees}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
