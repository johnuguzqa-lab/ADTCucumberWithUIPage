Feature: Carrots
  As a user of the Vegetable Counter
  I want to see how many carrots I have left
  So that I know what remains after eating some

  Scenario: Show how many carrots remain after eating some
    Given I am on the Vegetable Counter page
    And I have 10 carrots in stock
    And I eat 3 carrots
    When I calculate the remaining vegetables
    Then the application should show 7 carrots remaining
