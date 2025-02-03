import { Component } from '@angular/core';
import { SearchService } from '../../services/search.service';
import { SearchResult } from '../../models/search-result.model';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage {

  constructor(private searchService: SearchService) { }

  search() {
    const query = (document.getElementById('search-input') as HTMLInputElement).value;
    this.searchService.search(query).subscribe((results: SearchResult[]) => {
      const searchResults = document.getElementById('search-results');
      if (searchResults) {
        searchResults.innerHTML = '';
        results.forEach((result: SearchResult) => {
          const resultElement = document.createElement('div');
          resultElement.innerHTML = `<p>${result.name}</p>`;
          searchResults.appendChild(resultElement);
        });
      }
    });
  }
}
