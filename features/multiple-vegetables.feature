Feature: Multiple vegetables
  As a user of the Vegetable Counter
  I want to track several kinds of vegetables at once
  So that I can see the total remaining across my whole stock

  Scenario: Track several vegetables and show the combined total
    Given I am on the Vegetable Counter page
    And I have 8 cucumbers in stock
    And I have 5 carrots in stock
    And I eat 3 cucumbers
    And I eat 2 carrots
    When I calculate the remaining vegetables
    Then the application should show 5 cucumbers remaining
    And the application should show 3 carrots remaining
    And the application should show 8 vegetables remaining in total
