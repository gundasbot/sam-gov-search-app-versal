"use client";

import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Building2,
  MapPin,
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  Tag,
  Award,
} from "lucide-react";

interface Opportunity {
  noticeId: string;
  title: string;
  solicitationNumber?: string;
  department?: string;
  subtierName?: string;
  office?: string;
  fullParentPathName?: string;
  postedDate?: string;
  type?: string;
  baseType?: string;
  archiveType?: string;
  archiveDate?: string;
  responseDeadLine?: string;
  naicsCode?: string;
  classificationCode?: string;
  typeOfSetAsideDescription?: string;
  typeOfSetAside?: string;
  description?: string;
  organizationType?: string;
  placeOfPerformance?: {
    streetAddress?: string;
    streetAddress2?: string;
    city?: { code?: string; name?: string };
    state?: { code?: string; name?: string };
    zip?: string;
    country?: { code?: string; name?: string };
  };
  pointOfContact?: Array<{
    type?: string;
    title?: string;
    fullName?: string;
      email?: string;
      phone?: string;
      fax?: string;
    }>;
    links?: Array<{
      rel?: string;
      href?: string;
      description?: string;
    }>;
    resourceLinks?: string[];
    award?: {
      date?: string;
      number?: string;
      amount?: string | number;
      awardee?: {
        name?: string;
        location?: {
          streetAddress?: string;
          city?: { name?: string };
          state?: { code?: string };
          zip?: string;
          country?: { code?: string };
        };
        ueiSAM?: string;
        duns?: string;
      };
    };
    additionalInfoLink?: string;


