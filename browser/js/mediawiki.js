/* 
 * Copyright (C) 2012-2013 Bitergia
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
 *
 * This file is a part of the VizGrimoireJS package
 *
 * Authors:
 *   Alvaro del Castillo San Felix <acs@bitergia.com>
 *
 */

var Mediawiki = {};

(function() {

    var contribs_people = null, contribs_people_quarters = null;
    var contribs_companies = null, contribs_companies_quarters = null;
    var new_people = null, new_people_activity = null, people_leaving = null;
    var gone_people = null;
    var people_intake = null, people_top_all = null;
    var gerrit_url='https://gerrit.wikimedia.org';

    Mediawiki.getContribsPeople = function() {
        return contribs_people;
    };

    Mediawiki.getContribsCompanies = function() {
        return contribs_companies;
    };

    Mediawiki.getContribs = function(type, quarters) {
        var contribs_data = null;

        if (type === "companies" && !quarters) 
            contribs_data = contribs_companies;
        else if (type === "companies" && quarters) 
            contribs_data = contribs_companies_quarters;
        else if (type === "people" && !quarters) 
            contribs_data = contribs_people;
        else if (type === "people" && quarters) 
            contribs_data = contribs_people_quarters;
        return contribs_data;
    };

    Mediawiki.getContribsFile = function(type, quarters) {
        var filename = null;
        if (type === "companies" && !quarters)
            filename = Report.getDataDir()+"/scr-companies-all.json";
        else if (type === "companies" && quarters)
            filename = Report.getDataDir()+"/scr-companies-quarters.json";
        else if (type === "people" && !quarters) 
            filename = Report.getDataDir()+"/scr-people-all.json";
        else if (type === "people" && quarters)
            filename = Report.getDataDir()+"/scr-people-quarters.json";
        return filename;    
    };

    Mediawiki.setContribs = function (type, quarters, data) {
        if (type === "people" && !quarters) contribs_people = data;
        if (type === "people" && quarters) contribs_people_quarters = data;
        if (type === "companies" && !quarters) contribs_companies = data;
        if (type === "companies" && quarters) contribs_companies_quarters = data;
    };


    function getIdByName(item, type) {
        var id = 0;
        var data = null; 
        if (type === "companies")
            data = Mediawiki.getContribsCompanies();
        else if (type === "people")
            data = Mediawiki.getContribsPeople();
        else return id;

        for (var i = 0; i<data.id.length;i++) {
            if (data.name[i] === item) {
                id = data.id[i];
                break;
            }
        }
        return id;
    }

    function showContribs(div, type, quarter, search, show_links) {
        var quarters = false;
        if (quarter) quarters = true;
        var contribs_data = Mediawiki.getContribs(type, quarters);
        if (quarter) contribs_data = contribs_data[quarter];
        var html = "", table = "";

        table += "<table class='table table-hover'>";
        var id, name, total;
        for (var i = 0; i<contribs_data.id.length;i++) {
           name = contribs_data.name[i];
           total = contribs_data.total[i];
           id = contribs_data.id[i];
           table += "<tr><td>";
           if (type === "people" && show_links)
               table += "<a href='people.html?id="+id+"&name="+name+"'>";
           if (type === "companies" && show_links)
               table += "<a href='company.html?company="+name+"'>";
           table += name;
           if (show_links) table += "</a>";
           table += "</td><td>"+total;
           table += "</td></tr>";
        }
        table += "</table>";
        if (search) {
            html +="<FORM>Search ";
            html +='<input type="text" class="typeahead">';
            html += "</FORM>";
        }
        html += table;
        var data_source = null, updater = null;

        if (type === "people") {
            data_source = contribs_people.name;
            updater = function(item) {
                var id = getIdByName(item, type);
                var url = "people.html?id="+id+"&name="+item;
                window.open(url,"_self");
                return item;
            };
        }
        else if (type === "companies") {
            data_source = contribs_companies.name;
            updater = function(item) {
                var id = getIdByName(item, type);
                var url = "company.html?id="+id+"&name="+item;
                window.open(url,"_self");
                return item;
            };
        }

        $("#"+div).append(html);
        $('.typeahead').typeahead({
            source: data_source,
            updater: updater
        });
    }

    // Load all needed info at the start
    function loadContribs (cb) {
        $.when($.getJSON(Mediawiki.getContribsFile('people',false)),
               $.getJSON(Mediawiki.getContribsFile('people',true)),
               $.getJSON(Mediawiki.getContribsFile('companies',false)),
               $.getJSON(Mediawiki.getContribsFile('companies',true))
            ).done(function(ppl, ppl_quarters, comp, comp_quarters) {
                Mediawiki.setContribs ('people', false, ppl[0]);
                Mediawiki.setContribs ('people', true, ppl_quarters[0]);
                Mediawiki.setContribs ('companies', false, comp[0]);
                Mediawiki.setContribs ('companies', true, comp_quarters[0]);
                cb();
        });
    }

    function displayContribs(div, type, quarter, search, show_links) {
        var quarters = false;
        if (quarter) quarters = true;
        showContribs(div, type, quarter, search, show_links);
    }

    //
    // PeopleNew widget
    //

    Mediawiki.getPeopleNewActivityFile = function() {
        return Report.getDataDir()+"/new-people-activity-scr-evolutionary.json";
    };

    Mediawiki.setPeopleNewActivity = function (data) {
        new_people_activity = data;
    };

    Mediawiki.getPeopleNewActivity = function () {
        return new_people_activity;
    };

    Mediawiki.getPeopleNewFile = function() {
        return Report.getDataDir()+"/scr-code-contrib-new.json";
    };

    function loadPeopleNew (cb) {
        $.when($.getJSON(Mediawiki.getPeopleNewFile()),
                $.getJSON(Mediawiki.getPeopleNewActivityFile())
            ).done(function(new_people, new_people_activity) {
                Mediawiki.setPeopleNew (new_people[0]);
                Mediawiki.setPeopleNewActivity (new_people_activity[0]);
                cb();
        });
    }

    Mediawiki.setPeopleNew = function (data) {
        new_people = data;
    };

    Mediawiki.getPeopleNew = function (type) {
        if (type === undefined) return new_people;
        else return new_people[type];
    };

    // Show tables with selected fields
    function displayPeopleNew(divid, type, limit) {
        if (type === "all") return displayPeopleNewAll(divid, limit);
        var table = "<table class='table table-hover'>";
        var data = Mediawiki.getPeopleNew(type);
        var person_url_init = gerrit_url + "/r/#/q/owner:";
        var person_url_post = ",n,z";
        var field;
        table += "<tr>";
        table += "<th>Name</th><th>Submitted on</th><th>Status</th><th>Total</th>";
        if (data.revtime !== undefined) {table += "<th>Revision days</th>";}
        table += "</tr>";
        if (data.name.length<limit) limit = data.name.length;
        for (var i=0; i<limit; i++) {
            // Remove time
            var sub_on_date = data.submitted_on[i].split(" ")[0];
            table += "<tr>";
            var person_url = person_url_init + encodeURIComponent(data.email[i]) + person_url_post;
            table += "<td><a href='"+person_url+"'>"+data.name[i]+"</a></td>";
            table += "<td><a href='"+data.url[i]+"'>"+sub_on_date+"</a></td>";
            table += "<td>"+data.status[i]+"</td>";
            table += "<td style='text-align:right'>"+data.total[i]+"</td>";
            if (data.revtime !== undefined) {
                table += "<td style='text-align:right'>";
                table += Report.formatValue(data.revtime[i])+"</td>";
            }
            table += "</tr>";
        }
        table += "</table>";
        $("#"+divid).html(table);
    }


    function displayPeopleNewAll(divid, limit) {
        displayPeopleAll(divid, limit);
    }

    // Show all activity for a new person in one row
    function displayPeopleAll(divid, limit, gone) {
        var identities = Report.getPeopleIdentities();

        function showPeopleRow(data, index, type) {
            var i = index;
            // Remove time
            var sub_on_date = data.submitted_on[i].split(" ")[0];
            var person_url = person_url_init + encodeURIComponent(data.email[i]) + person_url_post;
            if (type === "submitters") {
                table += "<td><a href='"+person_url+"'>"+data.name[i]+"</a></td>";
                // var affiliation = "-";
                var affiliation = "Unknown";
                if (data.upeople_id[i] in identities) {
                    affiliation = searchAffiliation(identities[data.upeople_id[i]]);
                } 
                table += "<td>"+affiliation+"</td>";
                table += "<td><a href='"+data.url[i]+"'>"+sub_on_date+"</a></td>";
            }
            table += "<td style='text-align:right'>"+data.total[i]+"</td>";
        }

        var table = "<table class='table table-hover' ";
        table += "style='border-collapse:separate;border-spacing:30px 0px;'>";
        var data = null;
        if (gone) data = Mediawiki.getPeopleGone('submitters');
        else data = Mediawiki.getPeopleNew('submitters');
        var person_url_init = gerrit_url + "/r/#/q/owner:";
        var person_url_post = ",n,z";
        var field;
        var viz_people = [];
        table += "<tr>";
        table += "<th>Name</th>";
        table += "<th>Affiliation</th>";
        if (gone) table += "<th>Last date</th>";
        else table += "<th>First date</th>";
        table += "<th>Submitted</th>";
        table += "<th>Merged</th>";
        table += "<th>Abandoned</th>";
        table += "<th>Graph of Activity</th>";
        table += "</tr>";
        // Show full activity for new submitters
        if (data.name.length < limit) limit = data.name.length;

        var activity = null;
        if (gone) {
            activity = Mediawiki.getPeopleGoneActivity();
        }
        else {
            activity = Mediawiki.getPeopleNewActivity();
        }

        for (var i=0; i<limit; i++) {
            table += "<tr>";
            showPeopleRow(data, i, "submitters");
            // Other activity: Merged, abandoned and graph of activity
            var people_id = data.submitted_by[i];
            var upeople_id = data.upeople_id[i];

            var people_data = null;
            if (gone) people_data = Mediawiki.getPeopleGone('mergers');
            else people_data = Mediawiki.getPeopleNew('mergers');

            var index_people = people_data.submitted_by.indexOf(people_id);
            if (index_people > -1) {
                showPeopleRow(people_data, index_people, "mergers");
            } else {table +="<td></td>";}

            if (gone) people_data = Mediawiki.getPeopleGone('abandoners');
            else people_data = Mediawiki.getPeopleNew('abandoners');
            index_people = people_data.submitted_by.indexOf(people_id);

            if (index_people > -1) {
                showPeopleRow(people_data, index_people, "abandoners");
            } else {table +="<td></td>";}

            if (upeople_id in activity.people) {
                var people_divid =  "PeopleNew-evol-"+upeople_id;
                var newdiv = "<div style='height:20px' ";
                newdiv += "id="+people_divid+"></div>";
                table += "<td>"+newdiv+"</td>";
                viz_people.push(upeople_id);
            } 
            table += "</tr>";
        }
        table += "</table>";
        $("#"+divid).html(table);
        // Viz
        var DS = Report.getDataSourceByName("scr");
        var config = {};
        config.help = false;
        config.show_labels = false;
        config.show_legend = false;
        config.show_title = false;
        config.frame_time = true;
        config.graph = "bars";
        for (var j=0; j<viz_people.length; j++) {
            var people_divid = "PeopleNew-evol-"+viz_people[j];
            activity.submissions = activity.people[viz_people[j]].submissions;
            Viz.displayMetricsEvol(DS, ["submissions"], activity, people_divid, config);
        }
    }


    // Show full tables with all new people data
    // email, name, revtime, submitted_by, submitted_on, url
    function displayPeopleNewDebug(divid, type) {
        var table = "<table class='table table-hover'>";
        var data = Mediawiki.getPeopleNew(type);
        var field;
        table += "<tr>";
        $.each(data, function(key, value) {
            field = key;
            table += "<td>"+key+"</td>"
        });
        table += "</tr>";
        for (var i=0; i < data[field].length; i++) {
            table += "<tr>";
            $.each(data, function(key, value) {
                if (key === "url")
                table += "<td><a href='"+value[i]+"'>url</a></td>";
                else table += "<td>"+value[i]+"</td>"
            });
            table += "</tr>";
        }

        table += "</table>";
        $("#"+divid).html(table);
    }

    //
    // PeopleGoneActivity widget
    //

    Mediawiki.getPeopleGoneActivityFile = function() {
        return Report.getDataDir()+"/gone-people-activity-scr-evolutionary.json";
    };

    Mediawiki.setPeopleGoneActivity = function (data) {
        gone_people_activity = data;
    };

    Mediawiki.getPeopleGoneActivity = function () {
        return gone_people_activity;
    };

    Mediawiki.getPeopleGoneFile = function() {
        return Report.getDataDir()+"/scr-code-contrib-gone.json";
    };

    function loadPeopleGone (cb) {
        $.when($.getJSON(Mediawiki.getPeopleGoneFile()),
                $.getJSON(Mediawiki.getPeopleGoneActivityFile())
            ).done(function(gone_people, gone_people_activity) {
                Mediawiki.setPeopleGone (gone_people[0]);
                Mediawiki.setPeopleGoneActivity (gone_people_activity[0]);
                cb();
        });
    }

    Mediawiki.setPeopleGone = function (data) {
        gone_people = data;
    };

    Mediawiki.getPeopleGone = function (type) {
        if (type === undefined) return gone_people;
        else return gone_people[type];
    };

    // Show tables with selected fields
    function displayPeopleGone(divid, limit) {
        displayPeopleAll(divid, limit, true);
    }

    Mediawiki.convertPeopleGone = function() {
        var mark = "PeopleGone";
        var divs = $("."+mark);
        if (divs.length > 0) {
            var unique = 0;
            $.each(divs, function(id, div) {
                div.id = mark + (unique++);
                var limit = $(this).data('limit');
                displayPeopleGone(div.id, limit);
            });
        }
    }

    //
    // PeopleIntake widget
    //

    Mediawiki.getPeopleIntakeFile = function() {
        return Report.getDataDir()+"/scr-people-intake-evolutionary.json";
    };

    Mediawiki.setPeopleIntake = function (data) {
        people_intake = data;
    };

    Mediawiki.getPeopleIntake = function (type) {
        return people_intake;
    };

    function loadPeopleIntake (cb) {
        $.when($.getJSON(Mediawiki.getPeopleIntakeFile())
            ).done(function(activity) {
                Mediawiki.setPeopleIntake (activity);
                cb();
        });
    }

    function displayPeopleIntake(ds, divid, remove_last_point) {
        var config = {};
        config.help = false;
        config.show_title = false;
        config.show_legend = true;
        config.frame_time = true;
        if (remove_last_point) config.remove_last_point = true;
        Viz.displayMetricsEvol(ds,
                ["num_people_1","num_people_1_5","num_people_5_10"], 
                Mediawiki.getPeopleIntake(), divid, config);
    }

    Mediawiki.convertPeopleIntake = function() {
        var mark = "PeopleIntake";
        var divs = $("."+mark);
        if (divs.length > 0) {
            var unique = 0;
            $.each(divs, function(id, div) {
                div.id = mark + (unique++);
                var ds = $(this).data('data-source');
                var DS = Report.getDataSourceByName(ds);
                if (DS === null) return;
                var remove_last_point = $(this).data('remove-last-point');
                if (remove_last_point === undefined) remove_last_point = true;
                displayPeopleIntake(DS, div.id, remove_last_point);
            });
        }
    }

    //
    // PeopleTopAll widget
    //

    Mediawiki.getPeopleTopAllFile = function() {
        return Report.getDataDir()+"/all_top.json";
    };

    Mediawiki.setPeopleTopAll = function (data) {
        people_top_all = data;
    };

    Mediawiki.getPeopleTopAll = function (type) {
        return people_top_all;
    };

    function loadPeopleTopAll (cb) {
        $.when($.getJSON(Mediawiki.getPeopleTopAllFile())
            ).done(function(activity) {
                Mediawiki.setPeopleTopAll (activity);
                cb();
        });
    }

    // Return and array with people ids sorted by top position
    function orderPeopleTopAll() {
        var data = Mediawiki.getPeopleTopAll();
        var people_top = [];
        var people_sorted_ids = [];
        // Build an array with people id and total position
        // Remove the worst value
        $.each(data, function (id, value) {
            var position = 0;
            var worst_value = value[0].pos;
            for (var i=0; i<value.length; i++) {
                if (value[i].pos < worst_value) worst_value = value[i].pos;
                position += value[i].pos;
            }
            position -= worst_value
            people_top.push([id, parseInt(position/(value.length-1),null)]);
        });
        // Sort the array Create an array with people_id ordered by position
        people_top.sort(function(a, b) {return a[1] - b[1];});
        $.each(people_top, function(id, value) {
            people_sorted_ids.push(value[0]);
        });
        return people_sorted_ids;
    }

    function getPeopleTopAllDataSources() {
        var people_all = Mediawiki.getPeopleTopAll();
        var dss = [];
        $.each(people_all, function(id, value) {
            for (var i=0; i<value.length;i++) {
                if ($.inArray(value[i].ds, dss) === -1) dss.push(value[i].ds); 
            }
        });
        return dss;
    }

    // In JSON data there are several location. Select one.
    function searchLocation(data) {
        var location = data.country[0];
        return location;
    }

    // In JSON data there are several location. Select one.
    function searchAffiliation(data) {
        var affiliation = "";
        for (var i=0; i<data.affiliation.length;i++) {
            affiliation = data.affiliation[i];
            if (affiliation !== "Unknow") break; 
        }
        return affiliation;
    }

    function displayPeopleTopAll(divid) {
        var people_ids = orderPeopleTopAll();
        var people_all = Mediawiki.getPeopleTopAll();
        var identities = Report.getPeopleIdentities();
        var table = "<table class='table table-hover' ";
        table += "style='border-collapse:separate;border-spacing:10px 0px;'>";
        var data_sources = getPeopleTopAllDataSources();
        table += "<tr>";
        table += "<th>Rank</th><th>Name</th>";
        for (var i = 0; i < data_sources.length; i++) {
            var title = Report.getDataSourceByName(data_sources[i]).getTitle();
            table += "<th>"+title+"</th>";
        }
        table += "<th>Location</th>";
        table += "<th>Affiliation</th>";
        table += "</tr>";
        for (var i=0; i < people_ids.length; i++) {
            var pid = people_ids[i];
            var person_data = people_all[pid];
            table += "<tr>";
            table += "<td>"+(i+1)+"</td>";
            table += "<td><a href='people.html?id="+pid+"&name='>";
            if (pid in identities) table += identities[pid].identity[0];
            else table += pid;
            table += "</a></td>";
            for (var j =0; j < data_sources.length; j++) {
                people_ds_pos = "-";
                for (var k=0; k < person_data.length; k++) {
                    if (data_sources[j] == person_data[k].ds) {
                        people_ds_pos = person_data[k].pos;
                    }
                }
                table += "<td style='text-align:right'>"+people_ds_pos+"</td>";
            }

            // Add location and affiliation if data exists
            if (pid in identities) {
                table += "<td>"+searchLocation(identities[pid])+"</td>";
        		table += "<td>"+searchAffiliation(identities[pid])+"</td>";
            }
            table += "</tr>";
        }
        table += "</table>";
        $("#"+divid).html(table);

        // $("#"+divid).html("<h1>People TopAll</h1>");
    }

    Mediawiki.convertPeopleTopAll = function() {
        var mark = "PeopleTopAll";
        var divs = $("."+mark);
        if (divs.length > 0) {
            var unique = 0;
            $.each(divs, function(id, div) {
                div.id = mark + (unique++);
                displayPeopleTopAll(div.id);
            });
        }
    }


    //
    // TopIssues widget
    //
    Mediawiki.getTopIssuesFile = function() {
        return Report.getDataDir()+"/its-top.json";
    };

    Mediawiki.setTopIssues = function (data) {
        top_issues = data;
    };

    Mediawiki.getTopIssues = function (type) {
        if (type === undefined) return top_issues;
        else return top_issues[type];
    };

    function loadTopIssues (cb) {
        $.when($.getJSON(Mediawiki.getTopIssuesFile())
            ).done(function(top) {
                Mediawiki.setTopIssues (top);
                cb();
        });
    }

    function displayTopIssues(divid, type, limit) {
        var table = "<table class='table table-hover'>";
        var data = Mediawiki.getTopIssues(type);
        var field;
        var count = 0;
        table += "<tr>";
        table += "<th>Issue</th><th>Summary</th><th>Time (days)</th>";
        table += "</tr>";
        for (var i=0; i < data.issue_id.length && count<limit; i++) {
            if (data.summary[i].search("(tracking)") > -1) continue;
            table += "<tr>";
            table += "<td><a href='"+data.url[i]+"'>"+ data.issue_id[i]+"</a></td>";
            table += "<td>"+data.summary[i]+"</td>"
            table += "<td>"+Report.formatValue(data.time[i])+"</td>";
            table += "</tr>";
            ++count;
        }
        table += "</table>";
        $("#"+divid).html(table);
    }

     Mediawiki.convertTopIssues = function() {
        var mark = "TopIssues";
        var divs = $("."+mark);
        if (divs.length > 0) {
            var unique = 0;
            $.each(divs, function(id, div) {
                div.id = mark + (unique++);
                var type = $(this).data('type');
                var limit = $(this).data('limit');
                displayTopIssues(div.id, type, limit);
            });
        }
    }

    //
    // Testing top for Mediawiki widget
    //

    function displayTopList(div, ds, limit) {
        var top_file = ds.getTopDataFile();
        var basic_metrics = ds.getMetrics();

        $.getJSON(top_file, function(history) {
            $.each(history, function(key, value) {
                // ex: commits.all
                var data = key.split(".");
                var top_metric = data[0];
                var top_period = data[1];
                // List only all period 
                if (top_period !== "") return false;
                for (var id in basic_metrics) {
                    var metric = basic_metrics[id];
                    var html = '';
                    if (metric.column == top_metric) {
                        html = "<h4>"+top_metric+"</h4><ul>";
                        var top_data = value[top_metric];
                        var top_id = value.id;
                        for (var i=0; i<top_data.length; i++) {
                            html += "<li><a href='people.html?id=";
                            html += top_id[i]+"&name="+top_data[i]+"'>";
                            html += top_data[i]+"</a></li>";
                        }
                        html += "</ul>";
                        $("#"+div).append(html);
                        return false;
                    }
                }
            });
        });


    }

    function convertTop() {
        $.each(Report.getDataSources(), function(index, ds) {
            if (ds.getData().length === 0) return;

            var div_id_top = ds.getName()+"-top-mw";

            if ($("#"+div_id_top).length > 0) {
                if ($("#"+div_id_top).data('show_all')) show_all = true;
                var limit = $("#"+div_id_top).data('limit');
                displayTopList(div_id_top, ds, limit);
            }
        });
    }

    Mediawiki.convertContribs = function() {
        var mark = "Contribs";
        var divs = $("."+mark);
        if (divs.length > 0) {
            var unique = 0;
            $.each(divs, function(id, div) {
                div.id = mark + (unique++);
                var type = $(this).data('type');
                var quarter = $(this).data('quarter');
                var search = $(this).data('search');
                if (search === undefined) search = true;
                var show_links = true;
                if ($(this).data('show_links') !== undefined)
                    show_links = $(this).data('show_links');
                displayContribs(div.id, type, quarter, search, show_links);
            });
        }
    }

    Mediawiki.convertPeopleNew = function() {
        var mark = "PeopleNew";
        var divs = $("."+mark);
        if (divs.length > 0) {
            var unique = 0;
            $.each(divs, function(id, div) {
                div.id = mark + (unique++);
                var type = $(this).data('type');
                var limit = $(this).data('limit');
                displayPeopleNew(div.id, type, limit);
            });
        }
    }

    Mediawiki.convertPeopleNewActivity = function() {
        var mark = "PeopleNewActivity";
        var divs = $("."+mark);
        if (divs.length > 0) {
            var unique = 0;
            $.each(divs, function(id, div) {
                div.id = mark + (unique++);
                var ds = $(this).data('data-source');
                var DS = Report.getDataSourceByName(ds);
                if (DS === null) return;
                var limit = $(this).data('limit');
                displayPeopleNewActivity(DS, div.id, limit);
            });
        }
    }

    Mediawiki.build = function() {
        loadContribs(Mediawiki.convertContribs);
        loadPeopleGone(Mediawiki.convertPeopleGone);
        loadPeopleNew(Mediawiki.convertPeopleNew);
        loadTopIssues(Mediawiki.convertTopIssues);
        loadPeopleIntake(Mediawiki.convertPeopleIntake);
        loadPeopleTopAll(Mediawiki.convertPeopleTopAll);
    };
})();

Loader.data_ready(function() {
    Mediawiki.build();
});
