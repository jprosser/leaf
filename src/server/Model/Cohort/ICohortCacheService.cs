﻿// Copyright (c) 2019, UW Medicine Research IT, University of Washington
// Developed by Nic Dobbins and Cliff Spital, CRIO Sean Mooney
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
using System;
using System.Threading.Tasks;
using System.Security.Claims;
using Model.Cohort;
using Model.Authorization;

namespace Model.Cohort
{
    public interface ICohortCacheService
    {
        Task<Guid> CreateUnsavedQueryAsync(PatientCohort cohort, IUserContext user);
        Task DeleteUnsavedCohortAsync(IUserContext user);
    }
}
